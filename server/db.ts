/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { 
  User, Product, Order, TableReservation, Coupon, 
  InventoryItem, Supplier, SupportTicket, Review, MockEmail
} from "../src/types";

const DATA_DIR = path.join(process.cwd(), "data");

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Map database files
const FILE_PATHS = {
  users: path.join(DATA_DIR, "users.json"),
  products: path.join(DATA_DIR, "products.json"),
  orders: path.join(DATA_DIR, "orders.json"),
  reservations: path.join(DATA_DIR, "reservations.json"),
  coupons: path.join(DATA_DIR, "coupons.json"),
  inventory: path.join(DATA_DIR, "inventory.json"),
  suppliers: path.join(DATA_DIR, "suppliers.json"),
  tickets: path.join(DATA_DIR, "tickets.json"),
  emails: path.join(DATA_DIR, "emails.json"),
};

// Seed Data
const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "Artisanal Roasters Co.", contactPerson: "Marco Polo", phone: "+1 555-0192", email: "marco@artroasters.com", materials: ["Coffee Beans", "Espresso Pods"] },
  { id: "s2", name: "Organic Dairy Farms", contactPerson: "Sarah Jenkins", phone: "+1 555-0143", email: "delivery@organicdairy.com", materials: ["Fresh Milk", "Whipped Cream", "Butter", "Cheese"] },
  { id: "s3", name: "Elite Bakers Wholesale", contactPerson: "Pierre Dubois", phone: "+1 555-0122", email: "order@elitebakers.com", materials: ["Cheesecake Slabs", "Brioche Buns", "Croissants", "Tiramisu Cups"] },
  { id: "s4", name: "Flavors & Spices Ltd.", contactPerson: "Anita Roy", phone: "+1 555-0177", email: "spices@favors.com", materials: ["Cocoa Powder", "Vanilla Extract", "Truffle Oil", "Pepperoni"] },
];

const DEFAULT_COUPONS: Coupon[] = [
  { code: "CAFE10", discountPercent: 10, minOrderValue: 250, active: true, description: "Get 10% off on premium roasts! Valid on orders above ₹250." },
  { code: "LUXURYFREE", discountPercent: 15, minOrderValue: 500, active: true, description: "Unlock 15% discount for a luxurious dining feast! Valid on orders above ₹500." },
  { code: "FIRSTBREW", discountPercent: 20, minOrderValue: 150, active: true, description: "Welcome! Enjoy 20% off on your first coffee purchase." },
];

const DEFAULT_PRODUCTS: Product[] = [
  // COFFEE DRINKS
  {
    id: "p1",
    name: "Golden Crema Cappuccino",
    category: "Coffee",
    description: "Espresso pulled from rare single-origin Ethiopian beans, topped with aerated, velvety wet microfoam and dusted with dark Madagascar organic cocoa dust.",
    images: ["https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=600"],
    price: 240,
    discount: 5,
    gstPercent: 5,
    availability: true,
    ingredients: ["Single-Origin Espresso", "Steamed Farm Milk", "Velvet Microfoam", "Madagascar Cocoa Dust"],
    nutrition: { calories: 120, protein: "6g", carbs: "11g", fat: "5g" },
    variants: ["Regular", "Large", "Double Shot"],
    extraToppings: [
      { name: "Extra Espresso Shot", price: 60 },
      { name: "Vanilla Syrup", price: 40 },
      { name: "Caramel Drizzle", price: 30 }
    ],
    rating: 4.8,
    reviews: []
  },
  {
    id: "p2",
    name: "Charcoal Macchiato Duo",
    category: "Coffee",
    description: "Artisanal ristretto shots layered gently between silky steamed milk, activated charcoal cream swirl, and organic dark amber honey.",
    images: ["https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=600"],
    price: 280,
    discount: 0,
    gstPercent: 5,
    availability: true,
    ingredients: ["Ristretto Espresso", "Activated Charcoal Cream", "Milk", "Dark Amber Honey"],
    nutrition: { calories: 160, protein: "5g", carbs: "18g", fat: "6g" },
    variants: ["Regular", "Iced"],
    extraToppings: [{ name: "Oat Milk Swap", price: 50 }],
    rating: 4.6,
    reviews: []
  },
  {
    id: "p3",
    name: "Bourbon Barrel Cold Brew",
    category: "Coffee",
    description: "Slow-steeped for 24 hours in aged oak bourbon barrels giving rich smoky wood notes, served cold over a clear sphere of artisanal ice.",
    images: ["https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600"],
    price: 320,
    discount: 10,
    gstPercent: 5,
    availability: true,
    ingredients: ["Oak-aged Cold Brew Coffee", "Crystal Infused Water"],
    nutrition: { calories: 5, protein: "0g", carbs: "1g", fat: "0g" },
    variants: ["On the Rocks", "With Sweet Cream"],
    extraToppings: [{ name: "Vanilla Cold Foam", price: 50 }],
    rating: 4.9,
    reviews: []
  },

  // BURGERS
  {
    id: "p4",
    name: "Wagyu Butter Smash Burger",
    category: "Burger",
    description: "Finely marbled beef patty smashed on high-heat iron skillets, combined with slow-caramelized sweet white onions, melted sharp yellow cheddar, and house truffle butter on a freshly toasted French brioche bun.",
    images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"],
    price: 490,
    discount: 12,
    gstPercent: 18,
    availability: true,
    ingredients: ["Grass-fed Premium Beef Patty", "Truffle Butter", "Brioche Bun", "Sharp Cheddar", "Caramelized Onions"],
    nutrition: { calories: 680, protein: "28g", carbs: "42g", fat: "38g" },
    variants: ["Single Patty", "Double Stack"],
    extraToppings: [
      { name: "Extra Cheddar Slice", price: 40 },
      { name: "Crispy Bacon Strip", price: 90 },
      { name: "Fried Farm Egg", price: 50 }
    ],
    rating: 4.7,
    reviews: []
  },
  {
    id: "p5",
    name: "Crispy Avocado Herb Ranch",
    category: "Burger",
    description: "Golden buttermilk pan-fried chicken fillet seasoned with organic garlic salt, accompanied by fresh hand-mashed avocado smash, leafy garden greens, and homemade chive ranch on a seeded charcoal bun.",
    images: ["https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=600"],
    price: 410,
    discount: 5,
    gstPercent: 18,
    availability: true,
    ingredients: ["Buttermilk Fried Chicken", "Avocado Mash", "Seeded Charcoal Bun", "Chive Ranch", "Leafy Greens"],
    nutrition: { calories: 590, protein: "24g", carbs: "48g", fat: "26g" },
    variants: ["Regular", "Spicy Glaze"],
    extraToppings: [{ name: "Extra Avocado Scoop", price: 60 }],
    rating: 4.5,
    reviews: []
  },

  // PIZZAS
  {
    id: "p6",
    name: "Truffle Funghi & Mozzarella",
    category: "Pizza",
    description: "Slow-fermented sourdough pizza crust brushed with rich Italian white truffle emulsion, roasted portobello & porcini wild mushrooms, and creamy buffalo mozzarella with a drizzle of virgin olive oil.",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"],
    price: 650,
    discount: 8,
    gstPercent: 18,
    availability: true,
    ingredients: ["Sourdough Base", "Truffle Cream", "Portobello Mushrooms", "Buffalo Mozzarella", "Fresh Basil"],
    nutrition: { calories: 840, protein: "22g", carbs: "98g", fat: "22g" },
    variants: ["8 Inch Personal", "12 Inch Sharing"],
    extraToppings: [
      { name: "Extra Buffalo Mozzarella", price: 100 },
      { name: "Shaved Truffle Flakes", price: 150 }
    ],
    rating: 4.9,
    reviews: []
  },
  {
    id: "p7",
    name: "Fiery Pepperoni & Hot Amber",
    category: "Pizza",
    description: "Classic Neapolitan crust, crushed San Marzano tomato salsa, smoked cured pepperoni cuts, fresh mozzarella cubes, finished with house spicy honey drizzle.",
    images: ["https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600"],
    price: 580,
    discount: 0,
    gstPercent: 18,
    availability: true,
    ingredients: ["Sourdough Base", "San Marzano Tomatoes", "Cured Pepperoni", "Mozzarella", "Fiery Honey"],
    nutrition: { calories: 910, protein: "32g", carbs: "95g", fat: "29g" },
    variants: ["8 Inch Personal", "12 Inch Sharing"],
    extraToppings: [{ name: "Double Pepperoni", price: 120 }],
    rating: 4.8,
    reviews: []
  },

  // DESSERTS
  {
    id: "p8",
    name: "Classic New York Cheesecake",
    category: "Dessert",
    description: "Rich and ultra-creamy slow-baked classic cream cheese set on a crunchy premium cinnamon graham cracker crust, blanketed under hand-sourced wild strawberry preserve.",
    images: ["https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&q=80&w=600"],
    price: 310,
    discount: 10,
    gstPercent: 18,
    availability: true,
    ingredients: ["Cream Cheese", "Graham Cracker Crust", "Wild Strawberry Preserve", "Cinnamon", "Vanilla"],
    nutrition: { calories: 430, protein: "7g", carbs: "38g", fat: "21g" },
    variants: ["Single Slice", "Full Cake Request"],
    extraToppings: [{ name: "Whipped Cream Scoop", price: 30 }],
    rating: 4.7,
    reviews: []
  },
  {
    id: "p9",
    name: "Imperial Tiramisu Bowl",
    category: "Dessert",
    description: "Savoiardi ladyfinger biscuits drenched in gold espresso brew and fine coffee brandy, layered between whipped pasture egg-yolk and sweet mascarpone cheese, dusted heavily with rich Dutch chocolate solids.",
    images: ["https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600"],
    price: 360,
    discount: 0,
    gstPercent: 18,
    availability: true,
    ingredients: ["Savoiardi Ladyfingers", "Espresso Pulses", "Mascarpone Cheese", "Brandy Essence", "Cocoa Powder"],
    nutrition: { calories: 490, protein: "8g", carbs: "44g", fat: "23g" },
    variants: ["Standard Bowl", "Family Sized Tub"],
    extraToppings: [{ name: "Espresso Drizzle Shot", price: 40 }],
    rating: 4.8,
    reviews: []
  },

  // COMBOS
  {
    id: "p10",
    name: "Brewers Luxury Breakfast Combo",
    category: "Combo Meals",
    description: "A complete gourmet breakfast. Includes your choice of Golden Crema Cappuccino, a savory smashed avocado brioche toast, and a warm fresh butter croissant with berry cream.",
    images: ["https://images.unsplash.com/photo-1496042453676-e4a86bdfec63?auto=format&fit=crop&q=80&w=600"],
    price: 520,
    discount: 15,
    gstPercent: 18,
    availability: true,
    ingredients: ["Cappuccino", "Avocado Brioche Toast", "Fresh Butter Croissant", "Berry Cream Jam"],
    nutrition: { calories: 720, protein: "18g", carbs: "82g", fat: "28g" },
    variants: ["Regular Breakfast", "Hungry Brewer Stack"],
    extraToppings: [{ name: "Swap for Cold Brew", price: 30 }],
    rating: 4.9,
    reviews: []
  },
  {
    id: "p11",
    name: "Paparazzi Crust & Bean Deal",
    category: "Combo Meals",
    description: "A wonderful pairing of our Fiery Pepperoni 8-inch pizza alongside two refreshing Bourbon Barrel Cold Brews. Perfect for work lunch setups.",
    images: ["https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=600"],
    price: 790,
    discount: 20,
    gstPercent: 18,
    availability: true,
    ingredients: ["8-inch Pepperoni Pizza", "2 Bourbon Cold Brews"],
    nutrition: { calories: 920, protein: "33g", carbs: "98g", fat: "30g" },
    variants: ["With Cold Brews", "With Lattes"],
    extraToppings: [{ name: "Swap to Sharing Sized Pizza", price: 150 }],
    rating: 4.8,
    reviews: []
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "i1", ingredientName: "Coffee Beans", stockLevel: 85.5, unit: "kg", lowStockThreshold: 15.0, supplierId: "s1", expiryDate: "2027-04-12", updatedAt: new Date().toISOString() },
  { id: "i2", ingredientName: "Espresso Pods", stockLevel: 450, unit: "units", lowStockThreshold: 100, supplierId: "s1", expiryDate: "2027-01-30", updatedAt: new Date().toISOString() },
  { id: "i3", ingredientName: "Fresh Milk", stockLevel: 12.0, unit: "L", lowStockThreshold: 20.0, supplierId: "s2", expiryDate: "2026-06-25", updatedAt: new Date().toISOString() }, // Low stock to trigger alert!
  { id: "i4", ingredientName: "Whipped Cream", stockLevel: 4.5, unit: "L", lowStockThreshold: 10.0, supplierId: "s2", expiryDate: "2026-06-28", updatedAt: new Date().toISOString() }, // Low stock as well!
  { id: "i5", ingredientName: "Cheesecake Slabs", stockLevel: 45, unit: "units", lowStockThreshold: 15, supplierId: "s3", expiryDate: "2026-07-01", updatedAt: new Date().toISOString() },
  { id: "i6", ingredientName: "Brioche Buns", stockLevel: 120, unit: "units", lowStockThreshold: 30, supplierId: "s3", expiryDate: "2026-06-23", updatedAt: new Date().toISOString() },
  { id: "i7", ingredientName: "Truffle Oil", stockLevel: 2.2, unit: "L", lowStockThreshold: 0.5, supplierId: "s4", expiryDate: "2028-02-15", updatedAt: new Date().toISOString() }
];

// Helper to reliably read standard JSON files
function readJSONFile<T>(filePath: string, defaultData: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

// Helper to write JSON files
function writeJSONFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Database helper object
export const db = {
  // Read operations
  getUsers: (): User[] => readJSONFile<User[]>(FILE_PATHS.users, []),
  getProducts: (): Product[] => readJSONFile<Product[]>(FILE_PATHS.products, DEFAULT_PRODUCTS),
  getOrders: (): Order[] => readJSONFile<Order[]>(FILE_PATHS.orders, []),
  getReservations: (): TableReservation[] => readJSONFile<TableReservation[]>(FILE_PATHS.reservations, []),
  getCoupons: (): Coupon[] => readJSONFile<Coupon[]>(FILE_PATHS.coupons, DEFAULT_COUPONS),
  getInventory: (): InventoryItem[] => readJSONFile<InventoryItem[]>(FILE_PATHS.inventory, DEFAULT_INVENTORY),
  getSuppliers: (): Supplier[] => readJSONFile<Supplier[]>(FILE_PATHS.suppliers, DEFAULT_SUPPLIERS),
  getSupportTickets: (): SupportTicket[] => readJSONFile<SupportTicket[]>(FILE_PATHS.tickets, []),
  getEmails: (): MockEmail[] => readJSONFile<MockEmail[]>(FILE_PATHS.emails, []),

  // Write operations
  saveUsers: (users: User[]) => writeJSONFile<User[]>(FILE_PATHS.users, users),
  saveProducts: (products: Product[]) => writeJSONFile<Product[]>(FILE_PATHS.products, products),
  saveOrders: (orders: Order[]) => writeJSONFile<Order[]>(FILE_PATHS.orders, orders),
  saveReservations: (reservations: TableReservation[]) => writeJSONFile<TableReservation[]>(FILE_PATHS.reservations, reservations),
  saveCoupons: (coupons: Coupon[]) => writeJSONFile<Coupon[]>(FILE_PATHS.coupons, coupons),
  saveInventory: (inventory: InventoryItem[]) => writeJSONFile<InventoryItem[]>(FILE_PATHS.inventory, inventory),
  saveSuppliers: (suppliers: Supplier[]) => writeJSONFile<Supplier[]>(FILE_PATHS.suppliers, suppliers),
  saveSupportTickets: (tickets: SupportTicket[]) => writeJSONFile<SupportTicket[]>(FILE_PATHS.tickets, tickets),
  saveEmails: (emails: MockEmail[]) => writeJSONFile<MockEmail[]>(FILE_PATHS.emails, emails),

  // Transactions / queries helpers
  findUserById: (id: string): User | undefined => db.getUsers().find(u => u.id === id),
  findUserByEmail: (email: string): User | undefined => db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),
  
  saveUser: (user: User) => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    db.saveUsers(users);
  },

  addOrder: (order: Order) => {
    const orders = db.getOrders();
    orders.unshift(order); // Newest first
    db.saveOrders(orders);

    // Auto Stock Reduction logic
    const inventory = db.getInventory();
    order.items.forEach(item => {
      // Find matching ingredients
      const prod = db.getProducts().find(p => p.id === item.productId);
      if (prod) {
        prod.ingredients.forEach(ing => {
          // Find or create in inventory
          const invItem = inventory.find(i => i.ingredientName.toLowerCase() === ing.toLowerCase());
          if (invItem) {
            // Deduct proportional ingredient (approx 0.05kg or 1 unit per item qty)
            const factor = invItem.unit === "units" ? 1 : 0.05;
            invItem.stockLevel = Math.max(0, parseFloat((invItem.stockLevel - (item.quantity * factor)).toFixed(2)));
            invItem.updatedAt = new Date().toISOString();
          }
        });
      }
    });
    db.saveInventory(inventory);
  },

  updateOrderStatus: (orderId: string, status: string): Order | undefined => {
    const orders = db.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      const prevStatus = orders[idx].status;
      orders[idx].status = status as any;
      orders[idx].updatedAt = new Date().toISOString();
      db.saveOrders(orders);

      if (status === "Delivered" && prevStatus !== "Delivered") {
        db.sendMockDeliveryEmail(orders[idx]);
      }
      return orders[idx];
    }
    return undefined;
  },

  sendMockDeliveryEmail: (order: Order): MockEmail => {
    const emails = db.getEmails();
    const mailId = "mail-" + Math.floor(100000 + Math.random() * 900000);
    
    const itemsText = order.items.map(item => 
      `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
         <span style="color: #F5F5F4;">${item.quantity}x ${item.name} (${item.variant})</span>
         <span style="color: #A8A29E; font-family: monospace;">₹${item.totalPrice}</span>
       </div>`
    ).join("");

    const invoiceUrl = `/invoice/${order.id}`;

    const body = `
<div style="font-family: 'Inter', system-ui, sans-serif; background-color: #0C0A09; color: #F5F5F4; padding: 40px 30px; border-radius: 24px; border: 1px solid rgba(233, 196, 110, 0.2); max-width: 580px; margin: 0 auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
  <div style="text-align: center; margin-bottom: 30px;">
    <span style="font-size: 32px;">☕</span>
    <h1 style="color: #E9C46A; font-size: 26px; font-weight: 800; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">Brew & Bean</h1>
    <p style="color: #A8A29E; font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Specialty Roasters & Dine-In Lounge</p>
  </div>
  
  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; margin-bottom: 24px;">
    <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #E7E5E4;">Dear <strong>${order.userName}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #D6D3D1;">Your premium coffee & gourmet menu selection has been luxury crafted and successfully delivered directly to your hospitality lounge destination:</p>
    <div style="background-color: rgba(233, 196, 110, 0.04); border-left: 3px solid #E9C46A; padding: 12px 18px; margin: 16px 0; color: #F5F5F4; border-radius: 8px; font-size: 13px; font-family: monospace;">
      📍 ${order.address?.street || "VIP Main Desk Lounge"}, ${order.address?.city || ""}, ${order.address?.zipCode || ""}
    </div>
  </div>

  <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
    <h3 style="color: #E9C46A; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">Gastronomy Summary</h3>
    
    <div style="margin-bottom: 18px;">
      ${itemsText}
    </div>
    
    <div style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 14px; font-size: 13px; color: #A8A29E;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span>Basket Subtotal:</span> <span style="color: #F5F5F4; font-weight: bold;">₹${order.subtotal}</span>
      </div>
      ${order.discountAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #34D399;">
        <span>Loyalty Discount:</span> <span style="font-weight: bold;">-₹${order.discountAmount}</span>
      </div>` : ""}
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span>GST Service (5%):</span> <span style="color: #F5F5F4; font-weight: bold;">₹${order.gstAmount}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span>Delivery & Packing Charge:</span> <span style="color: #F5F5F4; font-weight: bold;">₹${order.deliveryCharge + order.packingCharge}</span>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; margin-top: 4px; font-weight: 800; font-size: 16px; color: #E9C46A; display: flex; justify-content: space-between;">
        <span>Grand Paid Total:</span> <span>₹${order.grandTotal}</span>
      </div>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${invoiceUrl}" style="background-color: #E9C46A; color: #0C0A09; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(233,196,110,0.2); transition: all 0.2s;">View Dedicated Invoice Page</a>
  </div>

  <div style="text-align: center; font-size: 10px; color: #78716C; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; margin-top: 10px; line-height: 1.5;">
    Thank you for selecting our artisan lounge experience.<br/>
    <span style="font-weight: 600; color: #A8A29E; display: inline-block; margin-top: 4px;">© 2026 Brew & Bean Specialty Coffee Co.</span><br/>
    This is a safe, sandboxed receipt email for Order #${order.id}.
  </div>
</div>
`;

    const newEmail: MockEmail = {
      id: mailId,
      to: order.userEmail,
      subject: `☕ Artisan Delivered! Invoice for Order #${order.id}`,
      body,
      sentAt: new Date().toISOString(),
      orderId: order.id,
      read: false,
    };

    emails.unshift(newEmail);
    db.saveEmails(emails);
    return newEmail;
  }
};
