/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User and Auth Roles
export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  mobile?: string;
  profilePhoto?: string;
  role: UserRole;
  addressBook: Address[];
  savedCards: SavedCard[];
  savedUPIs: string[];
  visits: number; // 0-7 visits for loyalty rewards
  unlockedRewardsCount: number; // Unlocked but unused free reward count
  rewardHistory: RewardHistoryItem[];
  joinedAt: string;
}

export interface Address {
  id: string;
  label: string; // e.g., Home, Office
  street: string;
  city: string;
  zipCode: string;
}

export interface SavedCard {
  id: string;
  cardHolder: string;
  cardNumber: string; // Masked e.g. **** **** **** 1234
  expiry: string;
  cardType: "visa" | "mastercard" | "amex";
}

// Product Interface
export interface Product {
  id: string;
  name: string;
  category: string; // e.g., Coffee, Burger, Pizza, Dessert, Combo
  description: string;
  images: string[];
  price: number;
  discount: number; // e.g., 10 for 10%
  gstPercent: number; // e.g., 5 or 18
  availability: boolean;
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  variants: string[]; // e.g., ["Regular", "Large", "Iced"]
  extraToppings: { name: string; price: number }[];
  rating: number; // Computed averate rating
  reviews: Review[];
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Shopping Cart Types
export interface CartItem {
  id: string; // Unique within cart (productId + selectedVariant + toppingsHash)
  productId: string;
  name: string;
  image: string;
  variant: string;
  toppings: { name: string; price: number }[];
  quantity: number;
  basePrice: number; // Base price for variant
  toppingPrice: number; // Toppings sum
  totalPrice: number; // (base + toppings) * qty
}

// Loyalty rewards
export type RewardChoice = "Coffee" | "Tea" | "Burger" | "Pizza Slice" | "French Fries" | "Cake" | "Ice Cream" | "Milkshake";

export interface RewardHistoryItem {
  id: string;
  choice: RewardChoice;
  redeemedAt: string;
}

// Order Management
export type OrderStatus = "Received" | "Preparing" | "Cooking" | "Packed" | "Out For Delivery" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  packingCharge: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: string; // UPI, Card, GooglePay, PhonePe, Paytm, Cash On Delivery
  paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded";
  address?: Address;
  couponCode?: string;
  earnedVisits: boolean; // Did this order increment loyalty visits?
  estimatedDeliveryTime: string; // e.g. "25-35 mins"
  createdAt: string;
  updatedAt: string;
}

// Table Reservations
export interface TableReservation {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  area: "indoor" | "outdoor" | "rooftop";
  status: "Confirmed" | "Cancelled" | "Completed";
  createdAt: string;
}

// Coupons
export interface Coupon {
  code: string;
  discountPercent: number;
  minOrderValue: number;
  active: boolean;
  description: string;
}

// Inventory and Suppliers
export interface InventoryItem {
  id: string;
  ingredientName: string;
  stockLevel: number; // in kg/liters/units
  unit: string; // e.g., kg, L, units
  lowStockThreshold: number;
  supplierId: string;
  expiryDate: string; // ISO date string
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  materials: string[]; // List of ingredients supplied
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
}

// Website and Financial Reports
export interface WebsiteStats {
  salesToday: number;
  ordersActive: number;
  inventoryAlerts: number;
  dailyRevenue: { date: string; sales: number; profit: number }[];
  categorySales: { name: string; value: number }[];
}

export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  orderId: string;
  read: boolean;
}
