export type UserRole = 'customer' | 'cashier' | 'admin';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cnic: string;
  role: UserRole;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  created_at?: string;
}

export interface AddOnOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  category_id: number;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: 'available' | 'out_of_stock';
  available_add_ons?: AddOnOption[];
}

export interface CartItemAddOn {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cart_item_id: string;
  product_id?: number;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  add_ons: CartItemAddOn[];
  special_instructions?: string;
  is_custom_item?: boolean;
}

export type OrderType = 'delivery' | 'pickup' | 'pos';
export type PaymentStatus = 'pending' | 'paid' | 'cash_on_delivery';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number;
  product_title?: string;
  quantity: number;
  add_ons_json: string;
  price: number;
}

export type OrderStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered' | 'completed';

export interface Order {
  id: number;
  user_id?: number | null;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  lat_long?: string;
  subtotal: number;
  tax: number;
  tip: number;
  delivery_fee: number;
  total: number;
  cash_given?: number;
  change_returned?: number;
  payment_status: PaymentStatus;
  status?: OrderStatus;
  items: {
    product_id?: number;
    title: string;
    quantity: number;
    price: number;
    add_ons: CartItemAddOn[];
    special_instructions?: string;
  }[];
  created_at: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  created_at?: string;
}

export interface StoreSettings {
  is_open: boolean;
  flat_delivery_fee: number;
  tax_rate: number; // e.g. 0.05 (5%)
  opening_hours: string;
  announcement: string;
  phone: string;
  address: string;
}

export interface SalesAnalytics {
  totalRevenue: number;
  onlineRevenue: number;
  inStoreRevenue: number;
  totalOrders: number;
  onlineOrdersCount: number;
  posOrdersCount: number;
  totalExpenses: number;
  netProfit: number;
  averageOrderValue: number;
  topSellingDishes: { title: string; count: number; revenue: number }[];
}

export interface AIReportSummary {
  headline: string;
  executiveSummary: string;
  strengths: string[];
  growthOpportunities: string[];
  inventoryAdvice: string[];
  profitabilityScore: number; // 1-100
}
