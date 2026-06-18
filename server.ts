/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";
import { Order, User, TableReservation, SupportTicket, RewardChoice, Review, Product, MockEmail } from "./src/types";
import { GoogleGenAI } from "@google/genai";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Auth token simulation (Simple resilient tokens in a lookup map)
const sessions = new Map<string, string>(); // Token -> User Email

// Security Helper Middleware: Authentication check
function getAuthenticatedUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  const email = sessions.get(token);
  if (!email) return null;
  return db.findUserByEmail(email) || null;
}

// Lazy-initialize Gemini client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Suggestions will use smart fallback.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Set up administrative user if not existing
const adminEmail = process.env.ADMIN_EMAIL || "admin@premiumcafe.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

// Create or verify default admin
const users = db.getUsers();
if (!users.some(u => u.role === "admin")) {
  users.push({
    id: "admin-id-1",
    email: adminEmail,
    name: "Master Barista (Admin)",
    mobile: "+1 555-0100",
    role: "admin",
    addressBook: [],
    savedCards: [],
    savedUPIs: [],
    visits: 0,
    unlockedRewardsCount: 0,
    rewardHistory: [],
    joinedAt: new Date().toISOString()
  });
  db.saveUsers(users);
}

// ==========================================
// AUTHENTICATION API ENDPOINTS
// ==========================================

app.post("/api/auth/register", (req, res) => {
  const { email, password, name, mobile } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "Missing required fields: email, password, name" });
    return;
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const newUser: User = {
    id: "user-" + crypto.randomUUID().substring(0, 8),
    email,
    name,
    mobile: mobile || "",
    role: "customer",
    addressBook: [],
    savedCards: [],
    savedUPIs: [],
    visits: 0,
    unlockedRewardsCount: 0,
    rewardHistory: [],
    joinedAt: new Date().toISOString()
  };

  const users_list = db.getUsers();
  users_list.push(newUser);
  db.saveUsers(users_list);

  // Generate session token
  const token = "token-" + crypto.randomBytes(16).toString("hex");
  sessions.set(token, newUser.email);

  res.status(201).json({ token, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  // Support custom admin credentials and fallback default credentials
  if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    const adminUser = db.getUsers().find(u => u.role === "admin");
    if (adminUser) {
      const token = "admin-token-" + crypto.randomBytes(16).toString("hex");
      sessions.set(token, adminUser.email);
      res.json({ token, user: adminUser });
      return;
    }
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = "token-" + crypto.randomBytes(16).toString("hex");
  sessions.set(token, user.email);

  res.json({ token, user });
});

app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    sessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

app.post("/api/auth/profile/update", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }

  const { name, mobile, addressBook, savedCards, savedUPIs, profilePhoto } = req.body;
  if (name !== undefined) user.name = name;
  if (mobile !== undefined) user.mobile = mobile;
  if (addressBook !== undefined) user.addressBook = addressBook;
  if (savedCards !== undefined) user.savedCards = savedCards;
  if (savedUPIs !== undefined) user.savedUPIs = savedUPIs;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

  db.saveUser(user);
  res.json({ success: true, user });
});


// ==========================================
// PRODUCT ENGINE API ENDPOINTS
// ==========================================

app.get("/api/products", (req, res) => {
  res.json(db.getProducts());
});

app.post("/api/products/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  const { rating, comment } = req.body;
  const productId = req.params.id;

  if (!rating || !comment) {
    res.status(400).json({ error: "Rating and comment required" });
    return;
  }

  const products = db.getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const newReview: Review = {
    id: "rev-" + crypto.randomUUID().substring(0, 8),
    productId,
    userName: user?.name || "Verified Customer",
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  prod.reviews.push(newReview);
  // Re-calculate average rating
  const total = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
  prod.rating = parseFloat((total / prod.reviews.length).toFixed(1));

  db.saveProducts(products);
  res.status(201).json({ success: true, product: prod });
});


// ==========================================
// COUPON ENGINE API ENDPOINTS
// ==========================================

app.get("/api/coupons", (req, res) => {
  res.json(db.getCoupons().filter(c => c.active));
});


// ==========================================
// RESERVATION API ENDPOINTS (ONLINE TABLE BOOKING)
// ==========================================

app.post("/api/reservations", (req, res) => {
  const user = getAuthenticatedUser(req);
  const { name, email, phone, date, time, guests, area } = req.body;

  if (!name || !email || !phone || !date || !time || !guests) {
    res.status(400).json({ error: "Missing required reservation details" });
    return;
  }

  const reservations = db.getReservations();
  const newReservation: TableReservation = {
    id: "resb-" + crypto.randomUUID().substring(0, 8),
    userId: user?.id || "guest",
    name,
    email,
    phone,
    date,
    time,
    guests: Number(guests),
    area: area || "indoor",
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  db.saveReservations(reservations);

  res.status(201).json({ success: true, reservation: newReservation });
});

app.get("/api/reservations/my", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  const reservations = db.getReservations().filter(r => r.userId === user.id);
  res.json(reservations);
});


// ==========================================
// SHOPPING CART & ORDER API ENDPOINTS
// ==========================================

app.post("/api/orders/checkout", (req, res) => {
  const user = getAuthenticatedUser(req);
  const { items, paymentMethod, address, couponCode, subtotal, discountAmount, gstAmount, deliveryCharge, packingCharge, grandTotal } = req.body;

  if (!items || items.length === 0 || !paymentMethod || !grandTotal) {
    res.status(400).json({ error: "Order details missing or cart is empty" });
    return;
  }

  // Create standard order
  const orderId = "order-" + Math.floor(100000 + Math.random() * 900000);
  
  const newOrder: Order = {
    id: orderId,
    userId: user?.id || "guest",
    userName: user?.name || "Guest Patron",
    userEmail: user?.email || "guest@premiumcafe.com",
    items,
    subtotal: Number(subtotal),
    discountAmount: Number(discountAmount),
    gstAmount: Number(gstAmount),
    deliveryCharge: Number(deliveryCharge),
    packingCharge: Number(packingCharge),
    grandTotal: Number(grandTotal),
    status: "Received",
    paymentMethod,
    paymentStatus: paymentMethod === "Cash On Delivery" ? "Pending" : "Completed",
    address,
    couponCode,
    earnedVisits: false,
    estimatedDeliveryTime: "25-35 mins",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // If user is validated, update loyalty visit progress!
  if (user && user.role === "customer") {
    user.visits += 1;
    newOrder.earnedVisits = true;

    // Check if loyalty reward unlocked! (Every completed/paid purchase of active customer adds a visit. On 7, unlock free reward)
    if (user.visits >= 7) {
      user.visits = 0; // Reset visit counter
      user.unlockedRewardsCount += 1; // Unlock one free item selection!
    }
    db.saveUser(user);
  }

  db.addOrder(newOrder);

  // Background logistics progression timer
  startOrderProgressionSimulation(newOrder.id);

  res.status(201).json({ success: true, order: newOrder, user });
});

// Helper function to simulate step-by-step cooking & delivery progression of orders
function startOrderProgressionSimulation(orderId: string) {
  const steps = ["Preparing", "Cooking", "Packed", "Out For Delivery", "Delivered"];
  let stepIdx = 0;
  
  const interval = setInterval(() => {
    const nextStatus = steps[stepIdx++];
    if (!nextStatus) {
      clearInterval(interval);
      return;
    }
    
    const currentOrder = db.getOrders().find(o => o.id === orderId);
    if (!currentOrder || currentOrder.status === "Cancelled" || currentOrder.status === "Delivered") {
      clearInterval(interval);
      return;
    }
    
    db.updateOrderStatus(orderId, nextStatus);
    console.log(`[ORDER SIMULATION] Order ${orderId} progressed to status: ${nextStatus}`);
    
    if (nextStatus === "Delivered") {
      clearInterval(interval);
    }
  }, 7000); // 7s per step, finishes in 35 seconds
}

// Mock Emails API Routes
app.get("/api/emails/my", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  const emails = db.getEmails().filter(e => e.to.toLowerCase() === user.email.toLowerCase());
  res.json(emails);
});

app.post("/api/emails/:id/read", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  const emails = db.getEmails();
  const email = emails.find(e => e.id === req.params.id && e.to.toLowerCase() === user.email.toLowerCase());
  if (email) {
    email.read = true;
    db.saveEmails(emails);
    res.json({ success: true, email });
  } else {
    res.status(404).json({ error: "Email not found" });
  }
});

app.post("/api/emails/:id/delete", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  let emails = db.getEmails();
  const exists = emails.some(e => e.id === req.params.id && e.to.toLowerCase() === user.email.toLowerCase());
  if (exists) {
    emails = emails.filter(e => !(e.id === req.params.id && e.to.toLowerCase() === user.email.toLowerCase()));
    db.saveEmails(emails);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Email not found" });
  }
});

app.get("/api/orders/my-history", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }
  const orders = db.getOrders().filter(o => o.userId === user.id);
  res.json(orders);
});

app.get("/api/orders/track/:id", (req, res) => {
  const order = db.getOrders().find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});


// ==========================================
// LOYALTY REWARDS REDEMPTION API
// ==========================================

app.post("/api/rewards/redeem", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }

  const { rewardChoice }: { rewardChoice: RewardChoice } = req.body;
  if (!rewardChoice) {
    res.status(400).json({ error: "Please select a valid reward choice" });
    return;
  }

  if (user.unlockedRewardsCount <= 0) {
    res.status(400).json({ error: "No free reward credits available. Earn stamps by completing coffee purchases!" });
    return;
  }

  // Deduct reward count and add history log
  user.unlockedRewardsCount -= 1;
  user.rewardHistory.push({
    id: "rwd-" + crypto.randomUUID().substring(0, 8),
    choice: rewardChoice,
    redeemedAt: new Date().toISOString()
  });

  db.saveUser(user);
  res.json({ success: true, user, message: `Hooray! You successfully redeemed: Free ${rewardChoice}!` });
});


// ==========================================
// SUPPORT TICKETS ENDPOINTS
// ==========================================

app.post("/api/tickets", (req, res) => {
  const user = getAuthenticatedUser(req);
  const { subject, message } = req.body;

  if (!subject || !message) {
    res.status(400).json({ error: "Subject and message required" });
    return;
  }

  const tickets = db.getSupportTickets();
  const newTicket: SupportTicket = {
    id: "tkt-" + crypto.randomUUID().substring(0, 8),
    userId: user?.id || "guest",
    userName: user?.name || "Customer Ticket",
    subject,
    message,
    status: "Open",
    createdAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  db.saveSupportTickets(tickets);

  res.status(201).json({ success: true, ticket: newTicket });
});

app.get("/api/tickets/my", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized session" });
    return;
  }

  const tickets = db.getSupportTickets().filter(t => t.userId === user.id);
  res.json(tickets);
});


// ==========================================
// ADMIN DASHBOARD & INVENTORY ENDPOINTS
// ==========================================

// Get operational KPIs and sales charts
app.get("/api/admin/stats", (req, res) => {
  const orders = db.getOrders();
  const inventory = db.getInventory();
  
  // Calculate revenue
  const totalSalesVal = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const activeOrdersCount = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
  const lowStockAlertsCount = inventory.filter(i => i.stockLevel <= i.lowStockThreshold).length;

  // Simulate monthly analytics chart
  const dailyRevMap = new Map<string, { date: string; sales: number; profit: number }>();
  
  // Pre-fill last 7 days chart labels
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyRevMap.set(label, { date: label, sales: 0, profit: 0 });
  }

  orders.slice(0, 50).forEach(o => {
    const orderDate = new Date(o.createdAt);
    const label = orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dailyRevMap.has(label)) {
      const current = dailyRevMap.get(label)!;
      current.sales += o.grandTotal;
      current.profit += o.grandTotal * 0.45; // Simulated 45% margin
    }
  });

  const dailyRevenue = Array.from(dailyRevMap.values());

  // Aggregate Category performance
  const cats = ["Coffee", "Pizza", "Burger", "Dessert", "Combo Meals"];
  const categorySales = cats.map(cat => {
    const totalCatSales = orders.reduce((sum, o) => {
      const catSum = o.items
        .filter(item => {
          const p = db.getProducts().find(prod => prod.id === item.productId);
          return p?.category === cat;
        })
        .reduce((s, item) => s + item.totalPrice, 0);
      return sum + catSum;
    }, 0);
    return { name: cat, value: totalCatSales || Math.floor(Math.random() * 2000 + 400) };
  });

  res.json({
    salesToday: totalSalesVal,
    ordersActive: activeOrdersCount,
    inventoryAlerts: lowStockAlertsCount,
    dailyRevenue,
    categorySales
  });
});

// Update Inventory levels manually or Auto Purchase Order
app.get("/api/admin/inventory", (req, res) => {
  res.json(db.getInventory());
});

app.post("/api/admin/inventory/:id/restock", (req, res) => {
  const { quantity } = req.body;
  if (!quantity) {
    res.status(400).json({ error: "Restock quantity required" });
    return;
  }

  const inventory = db.getInventory();
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  item.stockLevel = Number((item.stockLevel + Number(quantity)).toFixed(2));
  item.updatedAt = new Date().toISOString();
  db.saveInventory(inventory);

  res.json({ success: true, item });
});

app.get("/api/admin/suppliers", (req, res) => {
  res.json(db.getSuppliers());
});

app.get("/api/admin/orders", (req, res) => {
  res.json(db.getOrders());
});

app.post("/api/admin/orders/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "Order status parameter missing" });
    return;
  }

  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({ success: true, order: updated });
});


// ==========================================
// CLIENT-SIDE GEMINI API ENGINE (WITH ROBUST AI FALLBACK)
// ==========================================

app.post("/api/gemini/suggest", async (req, res) => {
  const { query, history } = req.body;
  if (!query) {
    res.status(400).json({ error: "Search or Voice query query requested" });
    return;
  }

  console.log(`Analyzing AI suggestion query: "${query}"`);

  // Try to use true server-side Gemini API with robust retry mechanism
  const ai = getAI();
  if (ai) {
    const maxRetries = 3;
    let attempt = 0;
    let responseText = "";
    while (attempt < maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `You are an premium virtual cafe barista assistant. The customer is asking: "${query}". Based on our signature menu, formulate a very friendly, polite, super concise cafe beverage or dining recommendation. Highlight ingredients, and mention our digital loyalty rewards system (buy 7 coffees get 1 free). Answer in 1-2 luxurious food-critic styled lines.`,
        });
        responseText = response.text || "Your gourmet selection awaits.";
        break; // Success, break the retry loop
      } catch (err: any) {
        attempt++;
        const isTransient = err.status === 503 || err.status === 429 || (err.message && (err.message.includes("503") || err.message.includes("429") || err.message.toLowerCase().includes("unavailable") || err.message.toLowerCase().includes("demand")));
        if (isTransient && attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`Gemini API temporarily unavailable (status 503/429), retrying in ${Math.round(backoff)}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
          console.log("Gemini API call could not be completed at this time, gracefully falling back to local heuristic intelligence.");
          break; // Stop retrying and fallback
        }
      }
    }
    if (responseText) {
      res.json({ suggestion: responseText });
      return;
    }
  }

  // Resilient Smart Heuristic Fallback
  let responseText = "Our Master Baristas suggest looking at the Brewers Luxury Breakfast Combo or the Golden Crema Cappuccino to pair with your morning rhythm!";
  const q = query.toLowerCase();

  if (q.includes("coffee") || q.includes("espresso") || q.includes("cappuccino") || q.includes("brew") || q.includes("latte") || q.includes("drink")) {
    responseText = "We highly recommend our signature Golden Crema Cappuccino with organic Madagascar cocoa or the 24-hr oak-aged Bourbon Barrel Cold Brew. Plus, this will add a stamp on your loyalty digital rewards tracker!";
  } else if (q.includes("burger") || q.includes("meat") || q.includes("avocado") || q.includes("chicken")) {
    responseText = "You would love our exquisite Wagyu Butter Smash Burger on slow-toasted brioche or the Crispy Avocado Herb Ranch with garlic-crusted butter chicken.";
  } else if (q.includes("pizza") || q.includes("funghi") || q.includes("cheese")) {
    responseText = "Indulge in our exquisite Truffle Funghi & Buffalo Mozzarella sourdough pizza or the Fiery Pepperoni drizzled with raw artisan spicy honey.";
  } else if (q.includes("dessert") || q.includes("cheesecake") || q.includes("sweet") || q.includes("cake") || q.includes("tiramisu")) {
    responseText = "No visit is complete without our classic slow-baked New York Cheesecake with wild strawberry preserves or the brandy-infused Imperial Tiramisu.";
  } else if (q.includes("offer") || q.includes("deal") || q.includes("discount") || q.includes("combo")) {
    responseText = "Take advantage of our 'Paparazzi Crust & Bean Deal' for a premium pepperoni personal pizza matched with two robust 24-hour Bourbon Cold Brews!";
  }

  res.json({ suggestion: responseText });
});


// ==========================================
// VITE AND STATIC PRODUCTION ROUTING SYSTEM
// ==========================================

const isProduction = process.env.NODE_ENV === "production";

async function bootServer() {
  if (!isProduction) {
    // Mount Vite dev server middleware so Express serves files beautifully
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted successfully.");
  } else {
    // Production statics
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist directory.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cafe E-Commerce full-stack app running transparently at http://localhost:${PORT}`);
  });
}

bootServer();
