import dotenv from 'dotenv';
dotenv.config();

import { User, Category, Product, Order, Expense, StoreSettings, SalesAnalytics } from '../src/types.ts';

import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_pos_db',
  waitForConnections: true,
  connectionLimit: 10,
    ssl: {
    minVersion: 'TLSv1.2',
  },
});

export async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
  }
}









// import { User, Category, Product, Order, Expense, StoreSettings, SalesAnalytics } from '../src/types.ts';

// Initial state mirroring schema.sql seed data
export const storeSettings: StoreSettings = {
  is_open: true,
  flat_delivery_fee: 120.0,
  tax_rate: 0.05,
  opening_hours: '11:00 AM - 01:30 AM (Daily)',
  announcement: 'Welcome to Savour Pulao & Chany! Savor the legendary fragrant Basmati chicken pulao, crispy shami kababs, Lahori chany, and fresh mint raita.',
  phone: '+92 51 2801122',
  address: 'Jinnah Avenue Blue Area Islamabad • Gordon College Road Rawalpindi • Shadman Lahore',
};

export const defaultAddOns = [
  { id: 'addon_1', name: 'Fresh Zeera & Mint Raita', price: 60.0 },
  { id: 'addon_2', name: 'Crispy Savour Shami Kabab', price: 110.0 },
  { id: 'addon_3', name: 'Extra Bowl of Lahori Chany', price: 120.0 },
  { id: 'addon_4', name: 'Extra Golden Roast Chicken Piece', price: 260.0 },
  { id: 'addon_5', name: 'Fresh Kachumber Onion Salad', price: 50.0 },
  { id: 'addon_6', name: 'Chilled Cold Drink (Can 250ml)', price: 120.0 },
];

export const users: User[] = [
  {
    id: 1,
    first_name: 'Hamza',
    last_name: 'Malik',
    email: 'admin@savourpulao.com',
    phone: '+92 300 8472910',
    cnic: '35201-1234567-1',
    role: 'admin',
    created_at: '2026-09-18 10:00:00',
  },
  {
    id: 2,
    first_name: 'Bilal',
    last_name: 'Tariq',
    email: 'cashier@savourpulao.com',
    phone: '+92 321 9876543',
    cnic: '35202-7654321-2',
    role: 'cashier',
    created_at: '2026-09-18 11:30:00',
  },
  {
    id: 3,
    first_name: 'Ayesha',
    last_name: 'Khan',
    email: 'customer@gmail.com',
    phone: '+92 333 4567890',
    cnic: '35201-9988776-5',
    role: 'customer',
    created_at: '2026-09-19 14:20:00',
  },
];

export const categories: Category[] = [
  { id: 1, name: 'Savour Signature Pulao', icon: 'Soup' },
  { id: 2, name: 'Lahori Desi Chany', icon: 'Flame' },
  { id: 3, name: 'Shami Kababs & Roast Chicken', icon: 'UtensilsCrossed' },
  { id: 4, name: 'Savour Burgers & Street Bites', icon: 'Beef' },
  { id: 5, name: 'Kheer, Raita & Sides', icon: 'Cookie' },
  { id: 6, name: 'Family Platters & Value Deals', icon: 'Sparkles' },
];

export const products: Product[] = [
  {
    id: 1,
    category_id: 1,
    title: 'Savour Special Chicken Pulao (Single)',
    description: 'The national legend: Fragrant aged Basmati rice cooked in slow-boiled chicken yakhni, served with 1 golden roast chicken piece, 1 crispy Shami Kabab, spiced Lahori chany gravy, mint raita & kachumber salad.',
    price: 490.0,
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 2,
    category_id: 1,
    title: 'Savour Double Chicken Pulao Platter',
    description: 'Generous feast of aromatic pulao, 2 golden roasted chicken pieces, 2 crispy beef Shami Kababs, hearty bowl of spiced chany, cooling zeera raita and crispy salad.',
    price: 850.0,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 3,
    category_id: 1,
    title: 'Savour Pulao with Shami Kababs (No Chicken)',
    description: 'Steaming plate of aromatic spiced pulao rice paired with 2 crispy beef Shami Kababs, fresh Lahori chany, mint raita & salad.',
    price: 380.0,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 4,
    category_id: 1,
    title: 'Plain Savour Basmati Pulao with Chany',
    description: 'A large steaming platter of our signature long-grain basmati rice cooked in aromatic chicken stock, accompanied by a bowl of spiced chany.',
    price: 290.0,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 5,
    category_id: 2,
    title: 'Special Savour Lahori Murgh Chany',
    description: 'Slow-simmered tender chicken pieces cooked in thick peppery chickpea gravy seasoned with black cumin, clove, and desi spices.',
    price: 420.0,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 6,
    category_id: 2,
    title: 'Desi Ghee Lahori Chany (Generous Bowl)',
    description: 'The iconic Lahore street recipe: Melt-in-mouth chickpeas stewed in pure desi ghee, crushed black pepper, and secret aromatic masala.',
    price: 240.0,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 7,
    category_id: 3,
    title: 'Crispy Savour Shami Kabab (2 Pcs)',
    description: 'Hand-crafted spiced beef mince and split lentil patties dipped in farm egg wash and shallow-fried golden.',
    price: 220.0,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 8,
    category_id: 3,
    title: 'Extra Golden Roast Chicken Piece',
    description: 'Quarter chicken (breast or leg) steam-cooked and flash-roasted with our heritage marinade for juicy meat and crisp skin.',
    price: 260.0,
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 9,
    category_id: 4,
    title: 'Savour Crispy Chicken Zinger Burger',
    description: 'Deep-fried golden chicken breast fillet with crisp lettuce, pickled gherkins, and spicy secret sauce on a toasted brioche bun.',
    price: 450.0,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 10,
    category_id: 4,
    title: 'Traditional Shami Egg Bun Kabab',
    description: 'Double beef shami patty, fried egg, sliced onions, mint raita, and zesty imli sauce tucked inside a soft grilled bun.',
    price: 220.0,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 11,
    category_id: 5,
    title: 'Savour Special Matka Kheer',
    description: 'Authentic clay pot chilled dessert prepared from slow-condensed milk, ground basmati, cardamom, and toasted pistachios.',
    price: 190.0,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
  {
    id: 12,
    category_id: 6,
    title: 'Savour Family Feast Box (4-5 Persons)',
    description: 'The complete feast: 4 Savour Chicken Pulao plates with 4 roast chicken pieces, 4 Shami Kababs, 2 large bowls of Lahori Chany, 4 Raitas, 4 Fresh Salads, and a chilled 1.5L soft drink.',
    price: 2450.0,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: defaultAddOns,
  },
];

export const expenses: Expense[] = [
  { id: 1, title: 'Farm Fresh Poultry & Meat Supply', category: 'Raw Materials', amount: 14500.0, date: '2026-09-19' },
  { id: 2, title: 'Weekly Dairy (Fresh Cream, Desi Ghee, Butter)', category: 'Raw Materials', amount: 8200.0, date: '2026-09-19' },
  { id: 3, title: 'Kitchen Natural Gas & Cylinder Refill', category: 'Utilities', amount: 4500.0, date: '2026-09-20' },
  { id: 4, title: 'Food Packaging, Boxes & Thermal Rolls', category: 'Packaging', amount: 3200.0, date: '2026-09-20' },
  { id: 5, title: 'Vegetables, Fresh Mint, Green Chillies & Onions', category: 'Raw Materials', amount: 2800.0, date: '2026-09-21' },
];

export const orders: Order[] = [
  {
    id: 101,
    user_id: 3,
    order_type: 'delivery',
    customer_name: 'Ayesha Khan',
    customer_phone: '+92 333 4567890',
    delivery_address: 'House 42, Street 8, Phase 5 DHA, Lahore',
    lat_long: '31.4721,74.3812',
    subtotal: 3000.0,
    tax: 150.0,
    tip: 150.0,
    delivery_fee: 150.0,
    total: 3450.0,
    payment_status: 'paid',
    status: 'delivered',
    items: [
      {
        product_id: 1,
        title: 'Savour Special Chicken Pulao (Single)',
        quantity: 2,
        price: 490.0,
        add_ons: [
          { id: 'addon_1', name: 'Fresh Zeera & Mint Raita', price: 60.0 },
          { id: 'addon_2', name: 'Crispy Savour Shami Kabab', price: 110.0 },
        ],
      },
      {
        product_id: 5,
        title: 'Special Savour Lahori Murgh Chany',
        quantity: 1,
        price: 420.0,
        add_ons: [{ id: 'addon_6', name: 'Chilled Cold Drink (Can 250ml)', price: 120.0 }],
      },
    ],
    created_at: '2026-09-19 19:42:00',
  },
  {
    id: 102,
    user_id: null,
    order_type: 'pos',
    customer_name: 'Walk-in Table 4 (Zubair)',
    customer_phone: '+92 322 1122334',
    delivery_address: 'In-Store Dining',
    subtotal: 2540.0,
    tax: 127.0,
    tip: 100.0,
    delivery_fee: 0.0,
    total: 2767.0,
    cash_given: 3000.0,
    change_returned: 233.0,
    payment_status: 'paid',
    status: 'completed',
    items: [
      {
        product_id: 3,
        title: 'Reshmi Kabab Platter (4 Pcs)',
        quantity: 2,
        price: 850.0,
        add_ons: [{ id: '5', name: 'Extra Spicy Chutney', price: 40.0 }],
      },
      {
        product_id: 7,
        title: 'Roghani Sesame Naan',
        quantity: 4,
        price: 90.0,
        add_ons: [],
      },
    ],
    created_at: '2026-09-20 20:15:00',
  },
  {
    id: 103,
    user_id: 3,
    order_type: 'pickup',
    customer_name: 'Ayesha Khan',
    customer_phone: '+92 333 4567890',
    delivery_address: 'Customer In-Store Pickup Counter',
    subtotal: 1650.0,
    tax: 82.5,
    tip: 50.0,
    delivery_fee: 0.0,
    total: 1782.5,
    payment_status: 'paid',
    status: 'on_the_way',
    items: [
      {
        product_id: 1,
        title: 'Mutton Shinwari Karahi (Half KG)',
        quantity: 1,
        price: 1650.0,
        add_ons: [{ id: '2', name: 'Roghani Naan', price: 90.0 }],
      },
    ],
    created_at: '2026-09-20 21:05:00',
  },
  {
    id: 104,
    user_id: null,
    order_type: 'pos',
    customer_name: 'Mr. Aslam (Takeaway)',
    customer_phone: '+92 301 7766554',
    delivery_address: 'In-Store Counter',
    subtotal: 1890.0,
    tax: 94.5,
    tip: 0.0,
    delivery_fee: 0.0,
    total: 1984.5,
    cash_given: 2000.0,
    change_returned: 15.5,
    payment_status: 'paid',
    status: 'completed',
    items: [
      {
        product_id: 4,
        title: 'Charcoal Mutton Chops (Half Dozen)',
        quantity: 1,
        price: 1890.0,
        add_ons: [],
      },
    ],
    created_at: '2026-09-21 18:30:00',
  },
];

export function calculateAnalytics(): SalesAnalytics {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const onlineRevenue = orders
    .filter((o) => o.order_type === 'delivery' || o.order_type === 'pickup')
    .reduce((sum, o) => sum + o.total, 0);
  const inStoreRevenue = orders
    .filter((o) => o.order_type === 'pos')
    .reduce((sum, o) => sum + o.total, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const onlineOrdersCount = orders.filter((o) => o.order_type === 'delivery' || o.order_type === 'pickup').length;
  const posOrdersCount = orders.filter((o) => o.order_type === 'pos').length;
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Aggregate dish sales
  const dishMap: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    for (const item of o.items) {
      if (!dishMap[item.title]) {
        dishMap[item.title] = { count: 0, revenue: 0 };
      }
      dishMap[item.title].count += item.quantity;
      dishMap[item.title].revenue += item.price * item.quantity;
    }
  }

  const topSellingDishes = Object.entries(dishMap)
    .map(([title, stats]) => ({
      title,
      count: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRevenue,
    onlineRevenue,
    inStoreRevenue,
    totalOrders,
    onlineOrdersCount,
    posOrdersCount,
    totalExpenses,
    netProfit,
    averageOrderValue,
    topSellingDishes,
  };
}
