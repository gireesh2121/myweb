/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Coffee, ShoppingBag, User as UserIcon, Calendar, Compass, 
  MapPin, Phone, Star, ShieldAlert, Check, Plus, Minus, Trash2, 
  Search, Mic, Tag, Award, Sparkles, HelpCircle, FileText, 
  ChevronRight, RefreshCw, AlertCircle, TrendingUp, Users, 
  Layers, Package, Send, ArrowRight, ShieldCheck, Heart, LogIn, LogOut, Mail
} from "lucide-react";
import { 
  User, Product, CartItem, Order, TableReservation, 
  Coupon, InventoryItem, Supplier, SupportTicket, RewardChoice, Review, MockEmail
} from "./types";

export default function App() {
  // Page Navigation State
  const [activeTab, setActiveTab] = useState<string>("home");
  
  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("cafe_token"));
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMobile, setAuthMobile] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<string[]>(["All", "Coffee", "Burger", "Pizza", "Dessert", "Combo Meals"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  
  // Suggestive AI / Gemini state
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Cart & checkout process
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponError, setCouponError] = useState<string>("");
  const [orderNote, setOrderNote] = useState<string>("");
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment" | "success">("cart");
  const [shippingAddress, setShippingAddress] = useState({ label: "Home", street: "", city: "", zipCode: "" });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("UPI");
  const [activePaymentNumber, setActivePaymentNumber] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Product Selection/Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedToppings, setSelectedToppings] = useState<{ name: string; price: number }[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");

  // Table reservation
  const [reserveForm, setReserveForm] = useState({ name: "", email: "", phone: "", date: "", time: "", guests: 2, area: "indoor" });
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Support logs
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Customer order history
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Loyalty states
  const [selectedRewardChoice, setSelectedRewardChoice] = useState<RewardChoice>("Coffee");
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardClaimMessage, setRewardClaimMessage] = useState("");

  // Mock Emails Sandbox state
  const [mockEmails, setMockEmails] = useState<MockEmail[]>([]);
  const [showInboxModal, setShowInboxModal] = useState<boolean>(false);
  const [activeEmailId, setActiveEmailId] = useState<string>("");
  const selectedEmail = mockEmails.find(e => e.id === activeEmailId) || mockEmails[0] || null;

  // Administrative / Dashboard controls (Loaded if user.role === 'admin')
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminInventory, setAdminInventory] = useState<InventoryItem[]>([]);
  const [adminSuppliers, setAdminSuppliers] = useState<Supplier[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [restockAmount, setRestockAmount] = useState<number>(20);
  const [activeRestockId, setActiveRestockId] = useState<string | null>(null);

  // Initialize and load core APIs
  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchCurrentUser();
      fetchMyHistory();
      fetchMyReservations();
      fetchMockEmails();

      // Poll periodically (every 5 seconds) to track real-time logistics status and mock emails
      const interval = setInterval(() => {
        fetchMyHistory();
        fetchMockEmails();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [token]);

  // Handle auto-load admin statistics if user is admin
  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching menu products:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Clear token if invalid
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await fetch("/api/orders/my-history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setOrderHistory(data);
        }
      }
    } catch (err) {
      console.error("Error fetching my order history:", err);
    }
  };

  const fetchMockEmails = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/emails/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMockEmails(data);
      }
    } catch (err) {
      console.error("Error fetching mock emails:", err);
    }
  };

  const markEmailAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMockEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
      }
    } catch (err) {
      console.error("Error marking mock email as read:", err);
    }
  };

  const deleteEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/${id}/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMockEmails(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error("Error deleting mock email:", err);
    }
  };

  const handleViewInvoiceFromEmail = (orderId: string) => {
    const matchedOrder = orderHistory.find(o => o.id === orderId);
    if (matchedOrder) {
      setCreatedOrder(matchedOrder);
      setCheckoutStep("success");
      setActiveTab("cart");
      setShowInboxModal(false);
    } else {
      fetch(`/api/orders/track/${orderId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Order not found");
        })
        .then(orderObj => {
          setCreatedOrder(orderObj);
          setCheckoutStep("success");
          setActiveTab("cart");
          setShowInboxModal(false);
        })
        .catch(err => {
          console.error("Could not find order:", err);
        });
    }
  };

  const fetchMyReservations = async () => {
    try {
      const res = await fetch("/api/reservations/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (err) {
      console.error(err);
    }
    try {
      const res = await fetch("/api/tickets/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [statsRes, invRes, supRes, ordRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: h }),
        fetch("/api/admin/inventory", { headers: h }),
        fetch("/api/admin/suppliers", { headers: h }),
        fetch("/api/admin/orders", { headers: h })
      ]);
      setAdminStats(await statsRes.json());
      setAdminInventory(await invRes.json());
      setAdminSuppliers(await supRes.json());
      setAdminOrders(await ordRes.json());
    } catch (err) {
      console.error("Error fetching administrative panel KPIs:", err);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegisterMode 
      ? { email: authEmail, password: authPassword, name: authName, mobile: authMobile }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("cafe_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        setAuthPassword("");
        setAuthName("");
        setAuthMobile("");
      } else {
        alert(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.removeItem("cafe_token");
    setToken(null);
    setUser(null);
    setActiveTab("home");
    setCart([]);
  };

  // Google Sign In Emulator (Secures user credential flows)
  const emulateGoogleLogin = async () => {
    const googleId = "google-" + Math.floor(Math.random() * 89999 + 10000);
    const mockEmail = `${user?.name ? user.name.replace(/\s+/g, "").toLowerCase() : "patron"}@gmail.com`;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          password: googleId,
          name: "Gireesh G (Google Customer)",
          mobile: "+1 555-0101"
        })
      });
      const data = await res.json();
      if (res.ok || res.status === 400) {
        // If already registered, simply log in
        const lRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: mockEmail, password: googleId })
        });
        const lData = await lRes.json();
        if (lRes.ok) {
          localStorage.setItem("cafe_token", lData.token);
          setToken(lData.token);
          setUser(lData.user);
          setShowAuthModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Voice Search Simulation & Smart AI Suggestion Engines
  const triggerVoiceSearch = () => {
    if (voiceActive) {
      setVoiceActive(false);
      return;
    }
    setVoiceActive(true);
    // Simulate speech-to-text decoding voice accents after 2 seconds
    const gourmetPrompts = [
      "Show me the best espresso and sweet combo discount",
      "I want a wood-fired truffle pizza slice and cold brew",
      "Which chocolate cake has low fat dairy?",
      "Do you offer free lattes on the loyalty reward card?"
    ];
    const pickedPrompt = gourmetPrompts[Math.floor(Math.random() * gourmetPrompts.length)];
    
    setTimeout(() => {
      setSearchQuery(pickedPrompt);
      setVoiceActive(false);
      fetchAISuggestion(pickedPrompt);
    }, 2000);
  };

  const fetchAISuggestion = async (queryText: string) => {
    if (!queryText) return;
    setLoadingAi(true);
    try {
      const res = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Cart Operations
  const handleAddToCart = (product: Product, variant: string, toppings: { name: string; price: number }[]) => {
    const toppingSum = toppings.reduce((sum, t) => sum + t.price, 0);
    const cartItemId = `${product.id}-${variant}-${toppings.map(t => t.name).sort().join(",")}`;
    
    const existingIndex = cart.findIndex(item => item.id === cartItemId);
    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = (updated[existingIndex].basePrice + updated[existingIndex].toppingPrice) * updated[existingIndex].quantity;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        image: product.images[0],
        variant: variant || product.variants[0] || "Regular",
        toppings,
        quantity: 1,
        basePrice: product.price,
        toppingPrice: toppingSum,
        totalPrice: product.price + toppingSum
      };
      setCart([...cart, newItem]);
    }
    
    // Auto clear product modal
    setSelectedProduct(null);
    setSelectedToppings([]);
  };

  const handleUpdateQty = (itemId: string, direction: number) => {
    const updated = cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + direction);
        return {
          ...item,
          quantity: newQty,
          totalPrice: (item.basePrice + item.toppingPrice) * newQty
        };
      }
      return item;
    });
    setCart(updated);
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Coupons Apply
  const applyCoupon = async () => {
    setCouponError("");
    if (!couponInput) return;
    try {
      const res = await fetch("/api/coupons");
      const list: Coupon[] = await res.json();
      const match = list.find(c => c.code.toUpperCase() === couponInput.toUpperCase());
      if (match) {
        const sub = calculateSubtotal();
        if (sub < match.minOrderValue) {
          setCouponError(`Min order of ₹${match.minOrderValue} required for this coupon.`);
          setSelectedCoupon(null);
        } else {
          setSelectedCoupon(match);
        }
      } else {
        setCouponError("Invalid or expired coupon code.");
        setSelectedCoupon(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pricing calculations
  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const calculateGst = () => Math.round(calculateSubtotal() * 0.05); // Standard 5% GST on dining service
  const calculatePackingCharge = () => cart.length > 0 ? 30 : 0;
  const calculateDeliveryCharge = () => calculateSubtotal() > 400 ? 0 : 40;
  const calculateDiscount = () => {
    if (selectedCoupon) {
      return Math.round(calculateSubtotal() * (selectedCoupon.discountPercent / 100));
    }
    return 0;
  };
  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateGst() + calculatePackingCharge() + calculateDeliveryCharge() - calculateDiscount();
  };

  // Submit Order Checkout
  const submitCheckout = async () => {
    if (cart.length === 0) return;
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    const payload = {
      items: cart,
      paymentMethod: selectedPaymentMethod,
      address: shippingAddress,
      couponCode: selectedCoupon?.code || "",
      subtotal: calculateSubtotal(),
      discountAmount: calculateDiscount(),
      gstAmount: calculateGst(),
      deliveryCharge: calculateDeliveryCharge(),
      packingCharge: calculatePackingCharge(),
      grandTotal: calculateGrandTotal()
    };

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedOrder(data.order);
        setOrderHistory(prev => [data.order, ...prev]);
        setCart([]); // Clear cart
        setSelectedCoupon(null);
        setCouponInput("");
        setCheckoutStep("success");
        // Update user visit state in local memory immediately
        if (user) {
          setUser(data.user);
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Table reservation booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reserveForm)
      });
      if (res.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          setReserveForm({ name: "", email: "", phone: "", date: "", time: "", guests: 2, area: "indoor" });
          fetchMyReservations();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Support Ticket submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject: ticketSubject, message: ticketMessage })
      });
      if (res.ok) {
        setSupportSuccess(true);
        setTicketSubject("");
        setTicketMessage("");
        setTimeout(() => {
          setSupportSuccess(false);
          fetchMyReservations(); // Load lists
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Active loyalty rewards claiming
  const handleRewardClaim = async (choice: RewardChoice) => {
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rewardChoice: choice })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setRewardClaimMessage(data.message);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setRewardClaimMessage("");
        }, 5000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin order status update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin restock inventory item
  const handleManualRestock = async (inventoryId: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${inventoryId}/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: restockAmount })
      });
      if (res.ok) {
        setActiveRestockId(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      if (res.ok) {
        const data = await res.json();
        // Update product state
        setSelectedProduct(data.product);
        setReviewComment("");
        fetchProducts(); // Refresh list
      } else {
        alert("Could not append review. Please verify validation guidelines.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products based on search & category tabs
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div id="cafe-management-root" className="min-h-screen bg-brand-dark text-brand-cream font-sans flex flex-col selection:bg-brand-gold selection:text-brand-dark overflow-x-hidden">
      
      {/* Sticky Premium Header Navigation */}
      <header className="sticky top-0 z-40 bg-brand-dark/85 backdrop-blur-md border-b border-white/5 h-20 transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab("home"); setCheckoutStep("cart"); }}>
            <div className="w-11 h-11 bg-brand-gold rounded-full flex items-center justify-center shadow-lg shadow-brand-gold/15 transition-transform hover:scale-105">
              <Coffee className="w-6 h-6 text-brand-dark stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-cream uppercase font-display leading-tight">
                BREW & <span className="text-brand-gold italic font-serif">BEAN</span>
              </h1>
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 block -mt-1 font-mono">Specialty Roasters</span>
            </div>
          </div>

          {/* Quick AI Voice Search Tool Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchAISuggestion(e.target.value);
                }}
                className="w-full bg-[#1C1917]/80 text-brand-cream placeholder:text-white/30 border border-white/10 rounded-full py-2.5 pl-11 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all"
                placeholder="Search single-origin, pizzas, burgers..."
              />
              <Search className="absolute left-4 top-3 w-4 h-4 text-white/30" />
              <button 
                onClick={triggerVoiceSearch}
                className={`absolute right-3 top-1.5 p-1.5 rounded-full transition-colors ${voiceActive ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-brand-gold'}`}
                title="Microphone Voice Suggest"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Tab System */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button 
              onClick={() => { setActiveTab("home"); setCheckoutStep("cart"); }}
              className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition-colors ${activeTab === "home" ? "text-brand-gold bg-white/5" : "text-white/60 hover:text-brand-gold"}`}
            >
              Exquisite Menu
            </button>
            <button 
              onClick={() => { setActiveTab("reservations"); }}
              className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition-colors ${activeTab === "reservations" ? "text-brand-gold bg-white/5" : "text-white/60 hover:text-brand-gold"}`}
            >
              Reservations
            </button>
            <button 
              onClick={() => { setActiveTab("rewards"); }}
              className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition-colors ${activeTab === "rewards" ? "text-brand-gold bg-white/5" : "text-white/60 hover:text-brand-gold"}`}
            >
              Loyalty & Offers
            </button>
            <button 
              onClick={() => { setActiveTab("support"); }}
              className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded-md transition-colors ${activeTab === "support" ? "text-brand-gold bg-white/5" : "text-white/60 hover:text-brand-gold"}`}
            >
              Support Tickets
            </button>
            {user?.role === "admin" && (
              <button 
                onClick={() => { setActiveTab("admin"); }}
                className="px-3 py-2 text-xs uppercase tracking-wider font-bold text-red-400 bg-red-950/20 border border-red-900/40 rounded-md transition-colors hover:bg-red-900/30 ml-2"
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* Action Center (Cart, Authentication, Mobile trigger) */}
          <div className="flex items-center space-x-4">
            
            {/* Mock Mail Inbox Indicator */}
            {token && (
              <motion.div 
                onClick={() => { setShowInboxModal(true); }}
                className="relative p-2 rounded-full hover:bg-[#1C1917] cursor-pointer transition-colors group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sandbox Email Notifications"
              >
                <Mail className="w-5.5 h-5.5 text-brand-gold transition-transform group-hover:scale-110 duration-300" />
                <AnimatePresence mode="popLayout">
                  {mockEmails.filter(e => !e.read).length > 0 && (
                    <motion.span 
                      key={mockEmails.filter(e => !e.read).length}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-amber-600 text-white font-mono text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg border border-[#0C0A09]"
                    >
                      {mockEmails.filter(e => !e.read).length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
            {/* Shopping Cart Indicator */}
            <motion.div 
              onClick={() => { setActiveTab("cart"); }}
              className="relative p-2 rounded-full hover:bg-[#1C1917] cursor-pointer transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="w-5.5 h-5.5 text-brand-gold transition-transform group-hover:rotate-12 duration-300" />
              <AnimatePresence mode="popLayout">
                {cart.length > 0 && (
                  <motion.span 
                    key={cart.reduce((sum, item) => sum + item.quantity, 0)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    whileHover={{ scale: 1.25 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 12 }}
                    className="absolute -top-1 -right-1 bg-brand-gold text-brand-dark font-mono text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg border border-[#0C0A09]"
                  >
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Profile / Auth Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => { setActiveTab("rewards"); }}
                  className="w-9 h-9 rounded-full border border-brand-gold/30 p-0.5 cursor-pointer hover:border-brand-gold transition-colors"
                  title="View profile & stamps"
                >
                  <img 
                    src={user.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                    alt="Customer avatar" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <button 
                  onClick={handleLogout}
                  className="hidden md:flex items-center space-x-1 text-[10px] uppercase tracking-widest text-white/40 hover:text-brand-gold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Out</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-brand-gold text-brand-dark text-xs uppercase font-bold tracking-widest px-4 py-2 rounded-full hover:bg-brand-gold/90 transition-all flex items-center space-x-1.5 shadow-lg shadow-brand-gold/15"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Join Club</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* AI SUGGESTION BANNER DISCOVERY */}
      {aiSuggestion && (
        <div className="bg-brand-gold/10 border-y border-brand-gold/25 py-3.5 px-4 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-brand-gold shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs text-brand-gold font-mono uppercase tracking-wider font-semibold">Gourmet AI Barista Recommendation</p>
              <p className="text-xs sm:text-sm text-brand-cream/90 leading-relaxed mt-0.5">{aiSuggestion}</p>
            </div>
            <button 
              onClick={() => setAiSuggestion("")} 
              className="text-white/40 hover:text-brand-gold text-xs font-semibold px-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT CANVAS CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* MOBILE NAVIGATION BAR ACTIONS */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 no-scrollbar border-b border-white/5 mb-6">
          <button 
            onClick={() => { setActiveTab("home"); setCheckoutStep("cart"); }}
            className={`px-4 py-2 whitespace-nowrap text-xs uppercase tracking-wider font-semibold rounded-full transition-all ${activeTab === "home" ? "bg-brand-gold text-brand-dark" : "bg-[#1C1917] text-white/70"}`}
          >
            Exquisite Menu
          </button>
          <button 
            onClick={() => { setActiveTab("reservations"); }}
            className={`px-4 py-2 whitespace-nowrap text-xs uppercase tracking-wider font-semibold rounded-full transition-all ${activeTab === "reservations" ? "bg-brand-gold text-brand-dark" : "bg-[#1C1917] text-white/70"}`}
          >
            Table Booking
          </button>
          <button 
            onClick={() => { setActiveTab("rewards"); }}
            className={`px-4 py-2 whitespace-nowrap text-xs uppercase tracking-wider font-semibold rounded-full transition-all ${activeTab === "rewards" ? "bg-brand-gold text-brand-dark" : "bg-[#1C1917] text-white/70"}`}
          >
            Loyalty Club
          </button>
          <button 
            onClick={() => { setActiveTab("support"); }}
            className={`px-4 py-2 whitespace-nowrap text-xs uppercase tracking-wider font-semibold rounded-full transition-all ${activeTab === "support" ? "bg-brand-gold text-brand-dark" : "bg-[#1C1917] text-white/70"}`}
          >
            Support Logs
          </button>
          {user?.role === "admin" && (
            <button 
              onClick={() => { setActiveTab("admin"); }}
              className="px-4 py-2 whitespace-nowrap text-xs uppercase tracking-wider font-bold rounded-full bg-red-950 text-red-300 border border-red-800"
            >
              Admin Stats
            </button>
          )}
        </div>

        {/* =========================================================================
            VIEW 1: LUXURIOUS MENU / STORE HOMEPAGE
            ========================================================================= */}
        {activeTab === "home" && (
          <div className="space-y-12">
            
            {/* HERO HERO GOURMET DECOR */}
            <div className="relative bg-gradient-to-br from-[#1C1917] to-brand-dark rounded-3xl border border-white/5 p-8 sm:p-12 lg:p-16 overflow-hidden flex flex-col justify-center min-h-[440px]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold opacity-5 blur-[120px] rounded-full"></div>
              
              <span className="text-brand-gold font-mono tracking-[0.3em] text-xs uppercase font-semibold mb-3 block">
                Artisan Specialty Selection
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light font-display leading-[1.1] mb-5 tracking-tight max-w-xl">
                Roasted to <br />
                <span className="font-serif italic text-brand-gold font-normal">Velvety Perfection</span>
              </h2>
              <p className="text-white/60 text-sm sm:text-base max-w-sm mb-7 leading-relaxed font-sans">
                Ethically harvested organic beans from high-altitude Ethiopian valleys. Experience the world's most aromatic coffee crafting process.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    const el = document.getElementById("gourmet-menu-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-brand-gold text-brand-dark px-7 py-3 rounded-full font-bold uppercase text-xs tracking-wider hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/15"
                >
                  Order Gourmet Menu
                </button>
                <button 
                  onClick={() => { setActiveTab("reservations"); }}
                  className="border border-white/20 hover:border-brand-gold text-brand-cream hover:bg-white/5 px-7 py-3 rounded-full font-semibold uppercase text-xs tracking-wider transition-all"
                >
                  Book Private Alcove
                </button>
              </div>

              {/* Float key metrics badges */}
              <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="text-lg sm:text-xl font-bold font-display text-brand-gold">100%</div>
                  <div className="text-[10px] uppercase text-white/40">Ethiopian Arabica</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold font-display text-brand-gold">24 Hrs</div>
                  <div className="text-[10px] uppercase text-white/40">Cold Slow Drip</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold font-display text-brand-gold">₹0</div>
                  <div className="text-[10px] uppercase text-white/40">Free Over ₹400</div>
                </div>
              </div>
            </div>

            {/* QUICK AI SECH & VOICE SEARCH FOR MOBILE */}
            <div className="block md:hidden bg-[#1C1917]/70 border border-white/5 rounded-2xl p-4">
              <label className="text-xs uppercase text-white/40 font-mono tracking-widest block mb-2">Voice AI Ordering Assistant</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchAISuggestion(e.target.value);
                  }}
                  className="w-full bg-[#0C0A09]/90 text-brand-cream border border-white/15 rounded-full py-2.5 pl-4 pr-11 text-xs focus:outline-none"
                  placeholder="Ask e.g. What's the best breakfast combo?"
                />
                <button 
                  onClick={triggerVoiceSearch}
                  className={`absolute right-1.5 top-1.5 p-1.5 rounded-full ${voiceActive ? 'bg-red-500 animate-pulse' : 'bg-brand-gold text-brand-dark'}`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* GOURMET CATEGORIES ROW CONTROLLER */}
            <div id="gourmet-menu-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold uppercase font-display tracking-wide text-brand-cream">
                    Explore Our <span className="text-brand-gold font-serif italic font-normal">Craft Menu</span>
                  </h3>
                  <p className="text-xs text-white/40 mt-1">Select from our chef-formulated seasonal provisions</p>
                </div>
                
                {/* Horizontal scroll select tabs */}
                <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar max-w-full sm:max-w-md">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs uppercase font-mono px-3 py-1.5 rounded-md border whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                          ? "bg-brand-gold/15 border-brand-gold text-brand-gold font-bold" 
                          : "border-white/5 text-white/40 hover:text-brand-cream hover:border-white/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRODUCTS CORNER GRID */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-[#1C1917]/30 border border-white/5 rounded-2xl">
                  <AlertCircle className="w-10 h-10 text-brand-gold/40 mx-auto mb-3" />
                  <p className="text-sm text-white/50 font-semibold">No seasonal coffees or pastries found matching parameters.</p>
                  <button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="text-brand-gold text-xs font-bold underline mt-2">
                    Reset Filter Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      className="group bg-[#1C1917]/50 border border-white/5 rounded-3xl overflow-hidden luxury-card luxury-card-hover flex flex-col justify-between"
                    >
                      {/* Photo wrapper */}
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {prod.discount > 0 && (
                          <span className="absolute top-4 left-4 bg-red-600 text-white font-mono text-[10px] font-bold uppercase px-2 py-1 rounded">
                            {prod.discount}% Off Today
                          </span>
                        )}
                        <span className="absolute bottom-4 right-4 bg-brand-dark/80 backdrop-blur-md border border-white/10 text-brand-gold font-mono text-xs font-bold px-2 py-1 rounded">
                          ★ {prod.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Info wrap */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4A373]/80">
                              {prod.category}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-white/40">
                              {prod.rating > 4.7 ? "★ Best Seller" : "Artisan Craft"}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-bold mt-1 text-brand-cream font-display group-hover:text-brand-gold transition-colors">
                            {prod.name}
                          </h4>
                          
                          <p className="text-xs text-white/50 leading-relaxed mt-2 line-clamp-3">
                            {prod.description}
                          </p>

                          {/* Preview ingredients */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {prod.ingredients.slice(0, 3).map((ing, i) => (
                              <span key={i} className="text-[9px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded">
                                {ing}
                              </span>
                            ))}
                            {prod.ingredients.length > 3 && (
                              <span className="text-[9px] text-white/30 px-1.5 py-0.5">+{prod.ingredients.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        {/* Price purchase row */}
                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-white/40 block line-through">
                              {prod.discount > 0 ? `₹${prod.price}` : ""}
                            </span>
                            <span className="text-lg font-bold font-mono text-brand-cream">
                              ₹{Math.round(prod.price * (1 - prod.discount / 100))}
                            </span>
                          </div>

                          <button 
                            onClick={() => {
                              setSelectedProduct(prod);
                              setSelectedVariant(prod.variants[0] || "");
                              setSelectedToppings([]);
                            }}
                            className="bg-brand-gold text-brand-dark px-4 py-2 rounded-full font-bold uppercase text-[10px] tracking-wider hover:bg-brand-gold/90 transition-all flex items-center space-x-1"
                          >
                            <span>Add To Brew</span>
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEASONAL OFFER BANNER DISPLAY */}
            <div className="bg-gradient-to-r from-brand-gold/15 to-transparent rounded-3xl border border-brand-gold/20 p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-brand-gold/25 text-brand-gold px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Seasonal Combo Deal</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-display uppercase text-brand-cream">
                    The Bankers Sweet <br />& Espresso Feast
                  </h3>
                  <p className="text-sm text-white/60 mt-3 leading-relaxed max-w-md">
                    Gourmet single slice Strawberry NY Cheesecake, matched with rare Single-Origin Golden Crema Cappuccino. Save 20% compared to traditional standalone menu selections.
                  </p>
                  <div className="mt-6 flex items-center space-x-4">
                    <div>
                      <span className="text-xs text-white/40 block line-through">₹550</span>
                      <span className="text-2xl font-bold font-mono text-brand-gold">₹399 Only</span>
                    </div>
                    <button 
                      onClick={() => {
                        const target = products.find(p => p.id === "p10");
                        if (target) {
                          setSelectedProduct(target);
                          setSelectedVariant("Regular Breakfast");
                        }
                      }}
                      className="bg-brand-gold text-brand-dark px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-gold/90 transition-transform"
                    >
                      Buy Combo Feast
                    </button>
                  </div>
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1496042453676-e4a86bdfec63?auto=format&fit=crop&q=80&w=600" 
                    alt="Premium combo promo" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <p className="text-xs text-brand-gold font-mono uppercase tracking-[0.2em]">Validated Artisan Brews</p>
                  </div>
                </div>
              </div>
            </div>

            {/* REVIEWS DISCOVERY PANEL */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase font-display tracking-wider text-brand-cream text-center">
                High Praise From <span className="text-brand-gold italic font-serif">Our Patrons</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1C1917]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex space-x-1 text-brand-gold mb-3">
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    "The Bourbon Barrel Cold Brew is a complete game changer. It carries these delicate woody notes that you can't find in any general cafe brand. Exceptionally professional layout too!"
                  </p>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#D4A373] mt-4">— Gireesh G., Verified Connoisseur</p>
                </div>
                <div className="bg-[#1C1917]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex space-x-1 text-brand-gold mb-3">
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    "Stamps accumulate instantly! I unlocked my Free Pizza Slice slice yesterday with no questions asked. Confetti popped right on my screen, highly responsive loyalty tracking."
                  </p>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#D4A373] mt-4">— Anita Roy, Regular Customer</p>
                </div>
                <div className="bg-[#1C1917]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex space-x-1 text-brand-gold mb-3">
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 fill-brand-gold text-brand-gold" />
                    <Star className="w-4.5 h-4.5 text-brand-gold" />
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    "The Wagyu Butter Smash Burger is pure luxury. Heavy rich cheddar, perfect texture. Sourdough base on pizza was light and carry beautiful airy bubbles."
                  </p>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#D4A373] mt-4">— Pierre D, French Culinary Enthusiast</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 2: ONLINE TABLE RESERVATIONS
            ========================================================================= */}
        {activeTab === "reservations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Reservation form block */}
            <div className="lg:col-span-7 bg-[#1C1917]/60 border border-white/5 rounded-3xl p-8 space-y-6">
              <div>
                <span className="text-brand-gold text-xs font-mono uppercase tracking-[0.2em]">Secure Private Seating</span>
                <h3 className="text-2xl font-bold uppercase font-display mt-1 text-brand-cream">
                  Luxury Table <span className="font-serif italic font-normal text-brand-gold">Reservation</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">Book your secure lounge area across our luxury patio settings</p>
              </div>

              {bookingSuccess ? (
                <div className="bg-emerald-950/40 border border-emerald-900/50 p-6 rounded-2xl text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-emerald-400 uppercase font-display">Reservation Confirmed!</h4>
                  <p className="text-xs text-white/70 max-w-sm mx-auto">
                    We've prioritized your luxury table. Our master hosts will email details shortly. Your designated server is preparing the space.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={reserveForm.name}
                        onChange={(e) => setReserveForm({...reserveForm, name: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={reserveForm.email}
                        onChange={(e) => setReserveForm({...reserveForm, email: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        placeholder="john@gourmet.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Mobile Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={reserveForm.phone}
                        onChange={(e) => setReserveForm({...reserveForm, phone: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        placeholder="+1 555-0199"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Guests Volume</label>
                      <select 
                        value={reserveForm.guests}
                        onChange={(e) => setReserveForm({...reserveForm, guests: Number(e.target.value)})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      >
                        <option value="2">2 Patrons (Couples Date)</option>
                        <option value="4">4 Patrons (Standard Board)</option>
                        <option value="6">6 Patrons (Premium Feast)</option>
                        <option value="10">10 Patrons (Corporate Dining)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Select Date</label>
                      <input 
                        type="date" 
                        required
                        value={reserveForm.date}
                        onChange={(e) => setReserveForm({...reserveForm, date: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Preferred Slot Time</label>
                      <input 
                        type="time" 
                        required
                        value={reserveForm.time}
                        onChange={(e) => setReserveForm({...reserveForm, time: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Gourmet Seating Area</label>
                      <select 
                        value={reserveForm.area}
                        onChange={(e) => setReserveForm({...reserveForm, area: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none"
                      >
                        <option value="indoor">Glass Orchid (Indoor AC)</option>
                        <option value="outdoor">Pebble Patio (Garden Breeze)</option>
                        <option value="rooftop">Gilded Sky Lounge (Rooftop View)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-gold text-brand-dark rounded-xl py-3 font-bold uppercase text-xs tracking-wider hover:bg-brand-gold/90 transition-all mt-4"
                  >
                    Confirm Table Allocation
                  </button>
                </form>
              )}
            </div>

            {/* My reserved listings sidebar */}
            <div className="lg:col-span-5 bg-[#1C1917]/30 border border-white/5 rounded-3xl p-6 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Your Booked Schedules</h4>
              
              {!token ? (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5">
                  <UserIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/50">Log in to track your personal seat reserves.</p>
                  <button onClick={() => setShowAuthModal(true)} className="text-brand-gold text-xs font-bold underline mt-1">Join Club</button>
                </div>
              ) : reservations.length === 0 ? (
                <p className="text-xs text-white/40">No reservation schedules registered for current sessions.</p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res: any, idx: number) => (
                    <div key={idx} className="bg-brand-dark/85 border border-white/15 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="text-xs font-bold uppercase text-brand-gold">{res.area === "rooftop" ? "Rooftop Sky" : res.area === "outdoor" ? "Patio" : "Glass Indoor"}</span>
                        </div>
                        <p className="text-xs text-white/80 mt-1">{res.guests} Guests — {res.date} at {res.time}</p>
                        <p className="text-[10px] text-white/40">ID: {res.id}</p>
                      </div>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                        {res.status || "CONFIRMED"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 3: LOYALTY CLUB & COFFEE STAMPS
            ========================================================================= */}
        {activeTab === "rewards" && (
          <div className="space-y-12">
            
            {/* CONFETTI GREETING NOTIFIER */}
            {showConfetti && (
              <div className="bg-gradient-to-r from-teal-950 to-brand-dark border-2 border-brand-gold/40 rounded-3xl p-6 text-center space-y-2 animate-bounce">
                <Sparkles className="w-12 h-12 text-brand-gold mx-auto animate-spin" />
                <h4 className="text-xl font-bold uppercase text-brand-gold font-display">Redemption Confirmed! 🎉</h4>
                <p className="text-xs text-brand-cream max-w-md mx-auto">{rewardClaimMessage}</p>
              </div>
            )}

            {/* STAMPS DISCOVERY PROFILE BLOCK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-7 bg-[#D4A373] text-[#0C0A09] rounded-3xl p-8 flex flex-col justify-between space-y-8 shadow-2xl">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight font-display">Loyalty Stamp Card</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#0C0A09]/75 font-mono">Premium Elite Member</p>
                    </div>
                    <div className="bg-[#0C0A09] text-brand-gold text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      Level 1: Barista Buddy
                    </div>
                  </div>
                  <p className="text-xs mt-3 opacity-90 max-w-sm">
                    Earn 1 visit stamp on every completed gourmet checkout. After 7 stamps, unlock 1 completely free signature beverage or dessert!
                  </p>
                </div>

                {/* Stamping indicators */}
                <div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const visitsCount = user ? user.visits : 0;
                      const active = idx < visitsCount;
                      return (
                        <div 
                          key={idx} 
                          className={`aspect-square rounded-full border-2 border-[#0C0A09] flex flex-col items-center justify-center font-bold ${
                            active 
                              ? "bg-[#0C0A09] text-brand-gold" 
                              : "border-dashed opacity-60 text-xs text-[#0C0A09]"
                          }`}
                        >
                          {active ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : idx === 6 ? (
                            <span className="text-[9px] font-bold">FREE</span>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress bar info */}
                  <div className="mt-6 flex justify-between items-center bg-[#0C0A09]/10 p-3.5 rounded-2xl">
                    <div className="text-xs font-semibold">
                      {user 
                        ? `${7 - user.visits} more visits to unlock free reward!` 
                        : "Join the Club to start collecting visits."
                      }
                    </div>
                    <span className="font-mono text-sm font-black italic">
                      {user ? `${user.visits}/7` : "0/7"} Stamps
                    </span>
                  </div>
                </div>
              </div>

              {/* Free claims and history drawer */}
              <div className="lg:col-span-5 bg-[#1C1917]/60 border border-white/5 rounded-3xl p-8 space-y-6">
                <div>
                  <Award className="w-8 h-8 text-brand-gold mb-2" />
                  <h4 className="text-lg font-bold uppercase tracking-wide text-brand-cream">Unlocked Free Rewards</h4>
                  <p className="text-xs text-white/50 mt-1">Select one free seasonal item below if you have reward credits</p>
                </div>

                {user && user.unlockedRewardsCount > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-brand-gold/15 border border-brand-gold/30 p-3.5 rounded-2xl text-center">
                      <p className="text-xs text-brand-gold font-bold">
                        Hurry! You have {user.unlockedRewardsCount} free rewards credit of choice.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(["Coffee", "Tea", "Burger", "Pizza Slice", "French Fries", "Cake", "Ice Cream", "Milkshake"] as RewardChoice[]).map(rwd => (
                        <button
                          key={rwd}
                          onClick={() => handleRewardClaim(rwd)}
                          className="bg-brand-dark hover:bg-brand-gold/10 border border-white/10 hover:border-brand-gold py-2 px-3 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
                        >
                          <span>{rwd}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-brand-gold" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-brand-dark/50 border border-white/10 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-brand-gold/30 mx-auto mb-2" />
                    <p className="text-xs text-white/50 px-4">No active reward credits. Purchases add stamps automatic!</p>
                  </div>
                )}
                
                {/* Reward logs */}
                {user && user.rewardHistory && user.rewardHistory.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-2">Claim History Logs</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {user.rewardHistory.map(h => (
                        <div key={h.id} className="flex justify-between text-xs bg-white/5 p-2 rounded">
                          <span className="text-brand-cream font-medium">Free {h.choice}</span>
                          <span className="text-white/40">{new Date(h.redeemedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gourmet Order History */}
                {token && orderHistory && orderHistory.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-2">My Coffee Purchase History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {orderHistory.map(o => (
                        <div key={o.id} className="bg-white/5 p-3 rounded-xl space-y-1.5 text-xs">
                          <div className="flex justify-between font-mono font-bold">
                            <span className="text-brand-gold">Order #{o.id}</span>
                            <span className="text-white/40">{new Date(o.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[11px] text-white/60">
                            {o.items.map((it, i) => (
                              <div key={i}>{it.quantity}x {it.name} ({it.variant})</div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5">
                            <span className="text-white/40">Total: <span className="font-mono text-brand-cream font-semibold">₹{o.grandTotal}</span></span>
                            <span className="text-emerald-400 uppercase font-bold">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* PRE-BUILT TASTY ONLINE OFFERS & COUPONS */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold uppercase tracking-wider text-brand-cream">
                Elite Customer Discount Codes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1C1917]/50 border border-dashed border-brand-gold/40 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] bg-brand-gold/20 text-brand-gold rounded font-mono px-2 py-0.5 font-bold">CAFE10</span>
                    <p className="text-xs font-bold mt-2 text-white/80">Get 10% Off and Free Shipping!</p>
                    <p className="text-[10px] text-white/40 mt-1">Valid only on premium single-origin roasts above ₹250.</p>
                  </div>
                  <button 
                    onClick={() => { setCouponInput("CAFE10"); setActiveTab("cart"); }}
                    className="text-brand-gold text-[10px] uppercase tracking-wider font-bold text-left hover:underline"
                  >
                    Apply Coupon Now →
                  </button>
                </div>
                <div className="bg-[#1C1917]/50 border border-dashed border-brand-gold/40 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] bg-brand-gold/20 text-brand-gold rounded font-mono px-2 py-0.5 font-bold">LUXURYFREE</span>
                    <p className="text-xs font-bold mt-2 text-white/80">15% Discount on Complete Combos</p>
                    <p className="text-[10px] text-white/40 mt-1">Enjoy high margin dining. Minimum basket sum ₹500.</p>
                  </div>
                  <button 
                    onClick={() => { setCouponInput("LUXURYFREE"); setActiveTab("cart"); }}
                    className="text-brand-gold text-[10px] uppercase tracking-wider font-bold text-left hover:underline"
                  >
                    Apply Coupon Now →
                  </button>
                </div>
                <div className="bg-[#1C1917]/50 border border-dashed border-brand-gold/40 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] bg-brand-gold/20 text-brand-gold rounded font-mono px-2 py-0.5 font-bold">FIRSTBREW</span>
                    <p className="text-xs font-bold mt-2 text-white/80">Newcomer Welcome 20% Discount</p>
                    <p className="text-[10px] text-white/40 mt-1">Applies instantly on items worth more than ₹150.</p>
                  </div>
                  <button 
                    onClick={() => { setCouponInput("FIRSTBREW"); setActiveTab("cart"); }}
                    className="text-brand-gold text-[10px] uppercase tracking-wider font-bold text-left hover:underline"
                  >
                    Apply Coupon Now →
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 4: CLIENT-SIDE SHOPPING CART & ROBUST INVOICES
            ========================================================================= */}
        {activeTab === "cart" && (
          <div>
            {checkoutStep === "cart" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Checkout items list */}
                <div className="lg:col-span-8 bg-[#1C1917]/50 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wide text-brand-cream">
                      Your Selected provisions
                    </h3>
                    <p className="text-xs text-white/40">Review, add syrups or proceed to layout order dispatch</p>
                  </div>

                  {cart.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-20 bg-brand-dark/20 border border-white/5 rounded-2xl"
                    >
                      <ShoppingBag className="w-12 h-12 text-brand-gold/30 mx-auto mb-3" />
                      <p className="text-sm text-white/50 font-semibold">Your gourmet dining basket is empty.</p>
                      <button 
                        onClick={() => { setActiveTab("home"); }} 
                        className="bg-brand-gold text-brand-dark px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider mt-4 hover:bg-brand-gold/90 transition-transform"
                      >
                        Explore Aromatic Coffees
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {cart.map(item => (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            layout
                            className="bg-brand-dark/60 border border-white/10 p-4 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-4 justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold text-brand-cream">{item.name}</h4>
                                <p className="text-xs text-brand-gold">{item.variant}</p>
                                {item.toppings.length > 0 && (
                                  <p className="text-[10px] text-white/40">
                                    + {item.toppings.map(t => t.name).join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-6">
                              {/* Quantity buttons */}
                              <div className="flex items-center space-x-1.5 bg-[#1C1917] p-1.5 rounded-lg border border-white/5">
                                <motion.button 
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10"
                                >
                                  <Minus className="w-3 h-3 text-brand-cream" />
                                </motion.button>
                                <span className="text-xs font-mono font-bold w-6 text-center">{item.quantity}</span>
                                <motion.button 
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10"
                                >
                                  <Plus className="w-3 h-3 text-brand-cream" />
                                </motion.button>
                              </div>

                              <span className="text-sm font-bold font-mono text-brand-cream w-20 text-right">
                                ₹{item.totalPrice}
                              </span>

                              <motion.button 
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleRemoveCartItem(item.id)}
                                className="text-red-400 hover:text-red-500 p-1.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Pricing aggregate and Address validation section */}
                {cart.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="lg:col-span-4 bg-[#1C1917]/50 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6"
                  >
                    <h4 className="text-sm font-bold uppercase tracking-wider text-brand-cream">Payment Invoices Draft</h4>
                    
                    {/* Add address detail */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block">Gourmet Delivery Destination</label>
                      <input 
                        type="text" 
                        required
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
                        placeholder="Street or Lounge Desk #..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          required
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
                          placeholder="City"
                        />
                        <input 
                          type="text" 
                          required
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                          className="bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
                          placeholder="Zip Code"
                        />
                      </div>
                    </div>

                    {/* Coupon section code */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block">Coupon Apply</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="flex-1 bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream uppercase focus:outline-none focus:ring-1 focus:ring-brand-gold"
                          placeholder="CAFE10, FIRSTBREW..."
                        />
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={applyCoupon}
                          className="bg-brand-gold text-brand-dark px-4 rounded-xl text-xs font-bold uppercase transition-shadow hover:shadow-lg hover:shadow-brand-gold/10"
                        >
                          Check
                        </motion.button>
                      </div>
                      {couponError && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="text-[10px] text-red-400 font-medium"
                        >
                          {couponError}
                        </motion.p>
                      )}
                      {selectedCoupon && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="text-[10px] text-emerald-400 font-semibold"
                        >
                          ✓ Coupon {selectedCoupon.code} applied! Saving {selectedCoupon.discountPercent}%.
                        </motion.p>
                      )}
                    </div>

                    {/* Invoice math summary */}
                    <div className="space-y-3 pt-4 border-t border-white/5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Basket Subtotal</span>
                        <motion.span 
                          key={calculateSubtotal()}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          ₹{calculateSubtotal()}
                        </motion.span>
                      </div>
                      <AnimatePresence>
                        {selectedCoupon && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-between text-emerald-400 overflow-hidden"
                          >
                            <span>Coupon Discount</span>
                            <span>-₹{calculateDiscount()}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">GST Service (5%)</span>
                        <motion.span 
                          key={calculateGst()}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          ₹{calculateGst()}
                        </motion.span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Gourmet Packing Charge</span>
                        <span>₹{calculatePackingCharge()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Specialty Delivery Charge</span>
                        <span>₹{calculateDeliveryCharge()}</span>
                      </div>
                      <div className="flex justify-between items-center text-brand-gold text-sm font-bold pt-2 border-t border-white/10 font-sans">
                        <span>Grand Cash Amount</span>
                        <motion.span 
                          key={calculateGrandTotal()}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 12 }}
                          className="text-base text-brand-cream font-mono font-extrabold text-brand-gold"
                        >
                          ₹{calculateGrandTotal()}
                        </motion.span>
                      </div>
                    </div>

                    {/* PAYMENT METHOD CHOOSING */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[10px] uppercase text-white/40 tracking-wider block">Choose Payment Gateway</label>
                      <select 
                        value={selectedPaymentMethod}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                      >
                        <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                        <option value="Credit Card">Credit Card (VPA encrypted)</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Net Banking">Net Banking (State Core Transfer)</option>
                        <option value="Cash On Delivery">Cash On Delivery (COD)</option>
                      </select>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: "#E9C46A" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
                          alert("Please fill complete address details before submitting luxury checkout!");
                          return;
                        }
                        submitCheckout();
                      }}
                      className="w-full bg-brand-gold text-brand-dark rounded-xl py-3 font-bold uppercase text-xs tracking-widest transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-gold/15"
                    >
                      <span>Authenticate Order & Pay ₹{calculateGrandTotal()}</span>
                    </motion.button>
                    
                    <p className="text-[10px] text-center text-white/30 italic">Secure 256-bit instant checkout layer</p>
                  </motion.div>
                )}

              </div>
            )}

            {/* PAYMENT SUCCESS PAGE & INVOICES DOWNLOAD */}
            {checkoutStep === "success" && createdOrder && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="max-w-2xl mx-auto bg-[#1C1917]/50 border border-brand-gold/20 rounded-3xl p-8 space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Check className="w-9 h-9 text-brand-dark stroke-[3]" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold uppercase font-display text-brand-gold">Order Sent to Chefs!</h3>
                  <p className="text-xs text-white/50 mt-1">Order Transaction Index: #{createdOrder.id}</p>
                </div>

                <div className="bg-brand-dark/60 border border-white/5 p-6 rounded-2xl text-left space-y-4">
                  <p className="text-xs uppercase tracking-widest font-mono text-brand-gold">Cafe GST Invoice Summary</p>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-white/40">
                      <span>Date Time</span>
                      <span>{new Date(createdOrder.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Customer Email</span>
                      <span>{createdOrder.userEmail}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Gateway Method</span>
                      <span>{createdOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Order Progression</span>
                      <span className="text-emerald-400 font-bold">{createdOrder.status}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] text-white/40 uppercase block mb-2">Provisions allocation</p>
                    {createdOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs py-1">
                        <span>{item.quantity}x {item.name} ({item.variant})</span>
                        <span>₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 text-xs flex justify-between font-bold">
                    <span>Invoice Final Amount Paid</span>
                    <span className="text-brand-gold text-sm font-sans font-black">₹{createdOrder.grandTotal}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => {
                      // Generate and download mock PDF
                      const blob = new Blob([JSON.stringify(createdOrder, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Invoice_Gourmet_Cafe_${createdOrder.id}.json`;
                      a.click();
                    }}
                    className="border border-[#D4A373]/40 bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Download JSON Invoice PDF
                  </button>
                  <button 
                    onClick={() => { setActiveTab("home"); setCheckoutStep("cart"); }}
                    className="bg-brand-gold text-brand-dark hover:bg-brand-gold/90 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Back to Coffee Feast
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 5: SUPPORT TICKETING CHAT
            ========================================================================= */}
        {activeTab === "support" && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-[#1C1917]/60 border border-white/5 rounded-3xl p-8 space-y-6">
              <div>
                <span className="text-brand-gold text-xs font-mono uppercase tracking-[0.2em]">Dedicated Hospitality Desk</span>
                <h3 className="text-2xl font-bold uppercase font-display mt-1 text-brand-cream">
                  Help & Support <span className="font-serif italic font-normal text-brand-gold">Tickets</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">Have an inquiry regarding bulk catering or corporate booking? Lodge a ticket.</p>
              </div>

              {supportSuccess ? (
                <div className="bg-emerald-950/40 border border-emerald-900/50 p-6 rounded-2xl text-center space-y-2">
                  <Check className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-emerald-400 uppercase font-display">Ticket Registered!</h4>
                  <p className="text-xs text-white/70">
                    Your query has been dispatched to our manager desk. Expect phone/email contact in less than 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Subject Matter</label>
                    <input 
                      type="text" 
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      placeholder="e.g. Broken packaging or refund query"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Detailed Message Description</label>
                    <textarea 
                      required
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      placeholder="Describe everything in detail..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-gold text-brand-dark rounded-xl py-3 font-bold uppercase text-xs tracking-wider"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>

            {/* List outstanding user tickets */}
            <div className="bg-[#1C1917]/30 border border-white/5 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-cream">Lodge Logs History</h4>
              
              {!token ? (
                <p className="text-xs text-white/40">Log in to track Support tickets.</p>
              ) : tickets.length === 0 ? (
                <p className="text-xs text-white/40">No active support tickets found.</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map(t => (
                    <div key={t.id} className="bg-brand-dark/70 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-brand-cream">{t.subject}</p>
                        <p className="text-xs text-white/50 mt-1">{t.message}</p>
                        <span className="text-[9px] text-white/30 block mt-2">Opened: {new Date(t.createdAt).toLocaleDateString()} — ID: {t.id}</span>
                      </div>
                      <span className="text-[9px] uppercase px-2 py-1 rounded bg-brand-gold/15 text-brand-gold font-bold">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: HIGH-LEVEL ADMINISTRATIVE PANEL & OPERATIONS CONTROL
            ========================================================================= */}
        {activeTab === "admin" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-red-400 text-xs font-mono uppercase tracking-[0.2em]">Management Command Room</span>
                <h3 className="text-2xl font-bold uppercase font-display mt-1 text-brand-cream">
                  Operations & Chef <span className="font-serif italic font-normal text-brand-gold">Dashboard</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">Track financial reports, adjust order prepared stages or fulfill low stocks</p>
              </div>
              <button 
                onClick={fetchAdminData}
                className="flex items-center space-x-1.5 self-start sm:self-center text-xs bg-white/5 text-white/70 border border-white/10 px-4 py-2 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Operational stats overview */}
            {adminStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#1C1917]/50 border border-white/5 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-950/40 rounded-xl flex items-center justify-center border border-emerald-900/40">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-white/40 block">Daily Cash Val</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">₹{adminStats.salesToday}</span>
                  </div>
                </div>
                <div className="bg-[#1C1917]/50 border border-white/5 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-950/40 rounded-xl flex items-center justify-center border border-indigo-900/40">
                    <Coffee className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-white/40 block">Incoming orders active</span>
                    <span className="text-xl font-bold text-indigo-400 font-mono">{adminStats.ordersActive} active</span>
                  </div>
                </div>
                <div className="bg-[#1C1917]/50 border border-white/5 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-950/40 rounded-xl flex items-center justify-center border border-amber-900/40">
                    <AlertCircle className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-white/40 block">Inventory stock alerts</span>
                    <span className="text-xl font-bold text-amber-500 font-mono">{adminStats.inventoryAlerts} items low</span>
                  </div>
                </div>
              </div>
            )}

            {/* Middle split: Active Orders Progression control and Inventory counters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left col: list commands to advance orders status (simulates delivery kitchen pipeline) */}
              <div className="lg:col-span-7 bg-[#1C1917]/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-cream">
                  Simulate Delivery/Kitchen Pipeline
                </h4>
                
                {adminOrders.length === 0 ? (
                  <p className="text-xs text-white/40">No guest checkouts registered on server currently.</p>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto no-scrollbar">
                    {adminOrders.map(o => (
                      <div key={o.id} className="bg-brand-dark border border-white/10 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            <span className="font-mono font-bold text-brand-gold">Order #{o.id}</span>
                            <span className="text-white/40 block text-[10px]">Customer: {o.userName} ({o.userEmail})</span>
                          </div>
                          <span className="text-[10px] font-mono whitespace-nowrap bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/20">
                            Current: {o.status}
                          </span>
                        </div>

                        {/* List items */}
                        <div className="text-[11px] text-white/60">
                          {o.items.map((it, i) => (
                            <div key={i}>• {it.quantity}x {it.name} ({it.variant})</div>
                          ))}
                        </div>

                        {/* Action buttons to progress delivery sequence */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                          {(["Preparing", "Cooking", "Packed", "Out For Delivery", "Delivered", "Cancelled"] as string[]).map(st => (
                            <button
                              key={st}
                              onClick={() => handleUpdateOrderStatus(o.id, st)}
                              className="text-[9px] uppercase font-bold py-1 px-2.5 rounded bg-white/5 border border-white/10 hover:border-brand-gold text-white/70 transition-all"
                            >
                              Move to: {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right col: Stock Level indicators */}
              <div className="lg:col-span-5 bg-[#1C1917]/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-brand-cream">Inventory Ingredient Counter</h4>
                  <p className="text-[10px] text-white/40">Ensures auto stock reduction works on orders</p>
                </div>

                <div className="space-y-4">
                  {adminInventory.map(item => {
                    const isLow = item.stockLevel <= item.lowStockThreshold;
                    return (
                      <div key={item.id} className="bg-brand-dark/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-brand-cream">{item.ingredientName}</span>
                          <span className={`font-mono text-xs font-bold ${isLow ? 'text-amber-500 animate-pulse' : 'text-emerald-400'}`}>
                            {item.stockLevel} {item.unit}
                          </span>
                        </div>

                        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, (item.stockLevel / (item.lowStockThreshold * 3)) * 100)}%` }}
                          ></div>
                        </div>

                        {isLow ? (
                          <div className="flex justify-between items-center bg-amber-950/30 p-2 rounded">
                            <span className="text-[9px] text-amber-500 font-bold">⚠️ Low Stock threshold met!</span>
                            <button 
                              onClick={() => setActiveRestockId(item.id)}
                              className="text-[9px] font-black uppercase text-brand-gold hover:underline"
                            >
                              Auto Purchase Restock
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-white/30 block">Stable reserve levels</span>
                        )}

                        {activeRestockId === item.id && (
                          <div className="bg-[#1C1917] p-2.5 rounded-lg border border-white/10 space-y-2 mt-2">
                            <label className="text-[9px] uppercase tracking-wider block text-white/40">Fulfill Quantity:</label>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                value={restockAmount}
                                onChange={(e) => setRestockAmount(Number(e.target.value))}
                                className="w-20 bg-[#0C0A09] text-xs text-brand-cream p-1 rounded focus:outline-none"
                              />
                              <button 
                                onClick={() => handleManualRestock(item.id)}
                                className="bg-brand-gold text-brand-dark font-mono text-[10px] font-bold px-3 py-1 rounded"
                              >
                                Fulfill
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Supplier Information Section */}
            <div className="bg-[#1C1917]/20 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-cream">
                Supplier Materials Directory
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {adminSuppliers.map(sup => (
                  <div key={sup.id} className="bg-brand-dark p-4 rounded-2xl border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-brand-gold uppercase">{sup.name}</p>
                    <p className="text-[10px] text-white/70">Contact: {sup.contactPerson}</p>
                    <p className="text-[10px] text-white/70">Phone: {sup.phone}</p>
                    <p className="text-[10px] text-white/40">Materials: {sup.materials.join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL COMPONENT 1: DETAILED PRODUCT VIEWER (VARIANTS & TOPPINGS PANEL)
          ========================================================================= */}
      {selectedProduct && (
        <div id="product-modal-layer" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-white/10 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative block">
            
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-brand-gold/15 p-2 rounded-full text-white/70 hover:text-brand-gold transition-colors"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
              
              {/* Product illustration wrap */}
              <div className="space-y-4">
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name} 
                  className="w-full aspect-square object-cover rounded-2xl"
                />
                
                {/* Nutrition blocks */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-mono bg-white/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-brand-gold block">{selectedProduct.nutrition.calories}</span>
                    <span className="text-white/40 text-[8px]">Cal</span>
                  </div>
                  <div>
                    <span className="text-brand-gold block">{selectedProduct.nutrition.protein}</span>
                    <span className="text-white/40 text-[8px]">Prot</span>
                  </div>
                  <div>
                    <span className="text-brand-gold block">{selectedProduct.nutrition.carbs}</span>
                    <span className="text-white/40 text-[8px]">Carb</span>
                  </div>
                  <div>
                    <span className="text-brand-gold block">{selectedProduct.nutrition.fat}</span>
                    <span className="text-white/40 text-[8px]">Fat</span>
                  </div>
                </div>
              </div>

              {/* Variant selections & price */}
              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-brand-gold font-mono uppercase">{selectedProduct.category}</span>
                  <h3 className="text-2xl font-bold uppercase font-display text-brand-cream mt-1">{selectedProduct.name}</h3>
                  <p className="text-xs text-white/55 leading-relaxed mt-2">{selectedProduct.description}</p>

                  {/* Choose Variant option */}
                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-white/40 block">Select Variant Option</label>
                    <div className="flex gap-2">
                      {selectedProduct.variants.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                            selectedVariant === v 
                              ? "bg-brand-gold/15 border-brand-gold text-brand-gold" 
                              : "border-white/10 text-white/60"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choose Toppings option */}
                  {selectedProduct.extraToppings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 block">Add Optional Toppings</label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.extraToppings.map(t => {
                          const active = selectedToppings.some(item => item.name === t.name);
                          return (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => {
                                if (active) {
                                  setSelectedToppings(selectedToppings.filter(item => item.name !== t.name));
                                } else {
                                  setSelectedToppings([...selectedToppings, t]);
                                }
                              }}
                              className={`text-[10px] py-1 px-2.5 rounded-full border ${
                                active 
                                  ? "bg-brand-gold text-brand-dark border-brand-gold font-bold" 
                                  : "border-white/10 text-white/40"
                              }`}
                            >
                              {t.name} (+₹{t.price})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm purchase btn */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase text-white/40">Gourmet Checkout Price</span>
                    <span className="text-xl font-bold font-mono">
                      ₹{selectedProduct.price + selectedToppings.reduce((s, t) => s + t.price, 0)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(selectedProduct, selectedVariant, selectedToppings)}
                    className="w-full bg-brand-gold text-brand-dark py-3 rounded-full font-bold uppercase text-xs tracking-wider"
                  >
                    Add to Brew Basket
                  </button>
                </div>

              </div>

            </div>

            {/* REVIEW FORM MODAL AT BOTTOM */}
            <div className="bg-brand-dark/40 border-t border-white/5 p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-cream">Submit Customer Review</h4>
              
              {!token ? (
                <p className="text-[10px] text-white/40">Please register or log in to post product reviews.</p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase text-white/40">Rating</span>
                    <select 
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="bg-[#0C0A09] text-xs text-brand-cream py-1 px-2 rounded focus:outline-none"
                    >
                      <option value="5">★★★★★ Outstanding (5)</option>
                      <option value="4">★★★★ Very Good (4)</option>
                      <option value="3">★★★ Average (3)</option>
                      <option value="1">★ Disappointed (1)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="flex-1 bg-[#0C0A09] text-xs text-brand-cream py-1.5 px-3 rounded-lg focus:outline-none"
                      placeholder="Comment e.g. Smooth roast, really loving it!"
                    />
                    <button 
                      type="submit"
                      className="bg-[#D4A373] text-[#0C0A09] font-mono text-[10px] font-bold px-4 rounded-lg"
                    >
                      Review
                    </button>
                  </div>
                </form>
              )}

              {/* Show reviews lists */}
              {selectedProduct.reviews.length > 0 && (
                <div className="space-y-2 max-h-24 overflow-y-auto pt-2">
                  {selectedProduct.reviews.map((r, i) => (
                    <div key={i} className="text-[10px] bg-brand-dark/80 p-2 rounded">
                      <div className="flex justify-between font-bold">
                        <span>{r.userName} (★{r.rating})</span>
                        <span className="text-white/30">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-white/70 mt-1">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL COMPONENT 2: CUSTOMER AUTH (REGISTRATION AND LOGIN FORM)
          ========================================================================= */}
      {showAuthModal && (
        <div id="auth-modal-layer" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-brand-dark border border-white/10 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl relative block p-8">
            
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-brand-gold transition-colors text-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-2 mb-6">
              <span className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-2">
                <Coffee className="w-5.5 h-5.5 text-brand-dark" />
              </span>
              <h3 className="text-xl font-bold uppercase font-display text-brand-cream">
                {isRegisterMode ? "Create Club Account" : "Access Cafe Account"}
              </h3>
              <p className="text-xs text-white/50">
                {isRegisterMode ? "Unlock our 7-stamp loyalty program completely free!" : "Welcome back. Log in to claim your unlocked lattes."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-[#0C0A09] border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Mobile Phone Number</label>
                    <input 
                      type="text" 
                      value={authMobile}
                      onChange={(e) => setAuthMobile(e.target.value)}
                      className="w-full bg-[#0C0A09] border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none"
                      placeholder="+1 555-0100"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#0C0A09] border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none"
                  placeholder="name@gourmet.com"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 tracking-wider block mb-1">Secure Password</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#0C0A09]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-brand-cream focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-gold text-brand-dark py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-brand-gold/90 transition-all mt-4"
              >
                {isRegisterMode ? "Create Account" : "Access Lounge Account"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 text-center space-y-3">
              {/* Google login simulator */}
              <button 
                onClick={emulateGoogleLogin}
                className="w-full bg-[#1C1917] hover:bg-[#262626] border border-white/10 text-brand-cream py-2.5 rounded-xl text-xs font-semibold uppercase flex items-center justify-center space-x-2"
              >
                <span>Sign in with Google</span>
              </button>

              <button 
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-[11px] text-brand-gold hover:underline font-bold"
              >
                {isRegisterMode ? "Already a club member? Log In" : "New around here? Create Member Profile"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MOCK INBOX SANDBOX MODAL DIALOGUE
          ========================================================================= */}
      {showInboxModal && (
        <div id="inbox-modal-layer" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in animate-duration-200">
          <div className="bg-[#12100E] border border-[#E9C46A]/20 max-w-5xl w-full h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
            
            {/* Modal Header */}
            <div className="bg-[#1C1917] p-5 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-full bg-[#E9C46A]/10 flex items-center justify-center border border-[#E9C46A]/20">
                  <Mail className="w-4 h-4 text-brand-gold" />
                </span>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-cream">Lounge Email Sandbox Client</h3>
                  <p className="text-[10px] text-white/40">Inspect automatic invoice & delivery receipts routed to {user?.email || "VIP customer"}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInboxModal(false)}
                className="text-white/50 hover:text-[#E9C46A] transition-colors text-base p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Email Workspace (Two Column: List on Left, Active Body on Right) */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Panel: Email list */}
              <div className="w-full sm:w-1/3 border-r border-white/5 flex flex-col overflow-y-auto no-scrollbar">
                {mockEmails.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/30 space-y-2">
                    <span className="text-3xl">📭</span>
                    <p className="text-xs font-mono">No simulation emails received yet.</p>
                    <p className="text-[10px] text-white/20">Checked out orders appear here as they progress live to 'Delivered' status!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {mockEmails.map((email, idx) => {
                      const isActive = activeEmailId === email.id || (!activeEmailId && idx === 0);
                      return (
                        <div 
                          key={email.id}
                          onClick={() => {
                            setActiveEmailId(email.id);
                            if (!email.read) {
                              markEmailAsRead(email.id);
                            }
                          }}
                          className={`p-4 cursor-pointer text-left transition-colors space-y-1.5 ${isActive ? 'bg-[#1C1917]/70 border-l-2 border-brand-gold' : 'hover:bg-[#1C1917]/20'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-mono leading-none px-1.5 py-0.5 rounded border ${email.read ? 'text-white/30 border-white/5 bg-transparent' : 'text-brand-gold border-brand-gold/20 bg-brand-gold/5'}`}>
                              {email.read ? 'Read' : 'NEW'}
                            </span>
                            <span className="text-[9px] text-white/30 font-mono">
                              {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-brand-cream truncate">{email.subject}</h4>
                            <p className="text-[10px] text-white/40 truncate">To: {email.to}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Panel: Active Email Viewer */}
              <div className="hidden sm:flex flex-1 bg-[#090807] flex-col overflow-y-auto p-6 md:p-8 relative">
                {selectedEmail ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                      <div className="space-y-1 text-left">
                        <h2 className="text-sm font-bold text-brand-cream">{selectedEmail.subject}</h2>
                        <p className="text-[10px] text-white/40">
                          <span className="text-white/20">From:</span> auto-alert@premiumcafe.com &bull; <span className="text-white/20">To:</span> {selectedEmail.to}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteEmail(selectedEmail.id)}
                        className="text-white/30 hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-colors"
                        title="Delete simulation log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Styled HTML Body Display */}
                    <div 
                      className="rounded-2xl max-w-xl mx-auto overflow-hidden shadow-lg cursor-default text-left"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const href = target.getAttribute("href") || target.closest("a")?.getAttribute("href");
                        if (href && href.startsWith("#invoice-")) {
                          e.preventDefault();
                          const orderId = href.replace("#invoice-", "");
                          handleViewInvoiceFromEmail(orderId);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30 space-y-3">
                    <span className="text-4xl text-white/10">✉️</span>
                    <p className="text-xs font-mono">Select a safe mock email alert on the left panel to inspect delivery invoice.</p>
                  </div>
                )}
              </div>

              {/* Mobile Email view drawer (when on small screens) */}
              {mockEmails.length > 0 && activeEmailId && (
                <div className="flex sm:hidden flex-col bg-[#090807] p-4 absolute inset-0 top-[73px] z-10 overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                    <button 
                      onClick={() => setActiveEmailId("")}
                      className="text-brand-gold text-xs font-bold uppercase tracking-wider"
                    >
                      ← Back to Inbox
                    </button>
                    <button 
                      onClick={() => {
                        deleteEmail(activeEmailId);
                        setActiveEmailId("");
                      }}
                      className="text-red-400 text-xs font-bold uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                  {(() => {
                    const emailObj = mockEmails.find(e => e.id === activeEmailId);
                    return emailObj ? (
                      <div className="space-y-4">
                        <div className="space-y-1 text-left">
                          <h4 className="text-xs font-bold text-white leading-tight">{emailObj.subject}</h4>
                          <span className="text-[9px] text-white/30 font-mono block">To: {emailObj.to}</span>
                        </div>
                        <div 
                          className="rounded-2xl overflow-hidden shadow-lg border border-white/5"
                          dangerouslySetInnerHTML={{ __html: emailObj.body }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            const href = target.getAttribute("href") || target.closest("a")?.getAttribute("href");
                            if (href && href.startsWith("#invoice-")) {
                              e.preventDefault();
                              const orderId = href.replace("#invoice-", "");
                              handleViewInvoiceFromEmail(orderId);
                            }
                          }}
                        />
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* CORE STANDARD PROFESSIONAL MINI FOOTER */}
      <footer className="mt-auto border-t border-white/5 py-8 bg-[#070606]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-[#D4A373] font-bold">© 2026 Brew & Bean specialty coffee co.</span>
          </div>
          <div className="flex space-x-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 hover:text-brand-gold cursor-pointer" onClick={() => alert("All user authored items are persistently locked.")}>Privacy policy</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 hover:text-brand-gold cursor-pointer" onClick={() => setActiveTab("support")}>Operational support Desk</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 hover:text-brand-gold cursor-pointer" onClick={() => alert("Our signature cafe is at: block 4, pebble beach boulevard.")}>Geological location map</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
