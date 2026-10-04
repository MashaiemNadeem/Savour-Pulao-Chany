import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  storeSettings,
  users,
  categories,
  products,
  expenses,
  orders,
  calculateAnalytics,
  defaultAddOns,
  testDatabaseConnection,
  db,
} from './server/database.ts';
import { generateSalesAnalyticsSummary } from './server/gemini.ts';
import { Order, Product, Expense, Category, User } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await testDatabaseConnection();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Store Status
  app.get('/api/store-status', (req, res) => {
    res.json({
      success: true,
      data: storeSettings,
      settings: storeSettings,
    });
  });

  app.post('/api/store-status', (req, res) => {
    const { is_open, flat_delivery_fee, opening_hours, announcement } = req.body;
    if (typeof is_open === 'boolean') {
      storeSettings.is_open = is_open;
    }
    if (typeof flat_delivery_fee === 'number') {
      storeSettings.flat_delivery_fee = flat_delivery_fee;
    }
    if (opening_hours) {
      storeSettings.opening_hours = opening_hours;
    }
    if (announcement) {
      storeSettings.announcement = announcement;
    }
    res.json({
      success: true,
      message: `Restaurant is now globally marked as ${storeSettings.is_open ? 'OPEN' : 'CLOSED'}.`,
      data: storeSettings,
      settings: storeSettings,
    });
  });

  // 3. Auth
  app.get('/api/auth/me', (req, res) => {
    res.json({
      authenticated: false,
      user: null,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { first_name, last_name, email, phone, cnic, password } = req.body;
    if (!first_name || !last_name || !email || !phone || !cnic || !password) {
      return res.status(422).json({ success: false, error: 'All fields are mandatory.' });
    }

    const cleanCnic = cnic.replace(/[^0-9]/g, '');
    if (cleanCnic.length !== 13) {
      return res.status(422).json({
        success: false,
        error: 'CNIC must be 13 digits (format: 35201-1234567-1).',
      });
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.cnic === cnic);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User with this email or CNIC already exists.' });
    }

    const newUser: User = {
      id: users.length + 1,
      first_name,
      last_name,
      email,
      phone,
      cnic,
      role: 'customer',
      created_at: new Date().toISOString(),
    };
    users.push(newUser);

    res.json({
      success: true,
      message: 'Account registered successfully!',
      user: newUser,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(422).json({ success: false, error: 'Email/Phone and password are required.' });
    }

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.phone.replace(/[^0-9]/g, '') === identifier.replace(/[^0-9]/g, '')
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found. Please register an account.' });
    }

    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: `Unauthorized. You do not have ${role} access.` });
    }

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user,
    });
  });

  app.get('/api/products', async (req, res) => {
    try {
      const [categoriesRows] = await db.query(
        'SELECT * FROM categories ORDER BY id'
      );

      const [productsRows] = await db.query(
        'SELECT * FROM products ORDER BY id'
      );

      const mysqlCategories = (categoriesRows as any[]).map((category) => ({
        id: category.id,
        name: category.name,
      }));

      const mysqlProducts = (productsRows as any[]).map((product) => ({
        id: product.id,
        category_id: product.category_id,
        title: product.title,
        description: product.description || '',
        price: Number(product.price),
        image_url: product.image_url || '',
        status: product.status || 'available',
        available_add_ons: defaultAddOns,
      }));

      res.json({
        success: true,
        categories: mysqlCategories,
        products: mysqlProducts,
      });
    } catch (error) {
      console.error('❌ Failed to load products:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to load products from database.',
      });
    }
  });



  app.post('/api/products', async (req, res) => {
    try {
      const {
        title,
        category_id,
        description,
        price,
        image_url,
        status,
      } = req.body;

      if (!title || !price || !category_id) {
        return res.status(422).json({
          success: false,
          error: 'Title, category, and price are required.',
        });
      }

      const [result] = await db.execute(
        `INSERT INTO products
        (category_id, title, description, price, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Number(category_id),
          title,
          description || '',
          Number(price),
          image_url ||
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
          status || 'available',
        ]
      );

      const insertResult = result as any;

      const [rows] = await db.execute(
        'SELECT * FROM products WHERE id = ?',
        [insertResult.insertId]
      );

      const product = {
        ...(rows as any[])[0],
        price: Number((rows as any[])[0].price),
        available_add_ons: defaultAddOns,
      };

      res.json({
        success: true,
        message: 'Dish created successfully.',
        product,
      });
    } catch (error) {
      console.error('❌ Failed to create product:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to create product in database.',
      });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);

      const {
        title,
        category_id,
        description,
        price,
        image_url,
        status,
      } = req.body;

      const [existingRows] = await db.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if ((existingRows as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Dish not found.',
        });
      }

      await db.execute(
        `UPDATE products
       SET category_id = ?,
           title = ?,
           description = ?,
           price = ?,
           image_url = ?,
           status = ?
       WHERE id = ?`,
        [
          Number(category_id),
          title,
          description || '',
          Number(price),
          image_url || '',
          status || 'available',
          id,
        ]
      );

      const [rows] = await db.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      const product = {
        ...(rows as any[])[0],
        price: Number((rows as any[])[0].price),
        available_add_ons: defaultAddOns,
      };

      res.json({
        success: true,
        message: 'Dish updated successfully.',
        product,
      });
    } catch (error) {
      console.error('❌ Failed to update product:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to update product in database.',
      });
    }
  });
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);

      const [existingRows] = await db.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if ((existingRows as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Dish not found.',
        });
      }

      await db.execute(
        'DELETE FROM products WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Dish deleted successfully.',
      });
    } catch (error) {
      console.error('❌ Failed to delete product:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete dish from database.',
      });
    }
  });
  // Categories CRUD
  app.post('/api/categories', async (req, res) => {
    try {
      const { name, icon } = req.body;

      if (!name) {
        return res.status(422).json({
          success: false,
          error: 'Category name is required.',
        });
      }

      const [result] = await db.execute(
        `INSERT INTO categories (name, icon)
       VALUES (?, ?)`,
        [name, icon || 'Utensils']
      );

      const insertResult = result as any;

      const [rows] = await db.execute(
        'SELECT * FROM categories WHERE id = ?',
        [insertResult.insertId]
      );

      res.json({
        success: true,
        message: 'Category created successfully.',
        category: (rows as any[])[0],
      });
    } catch (error) {
      console.error('❌ Failed to create category:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to create category in database.',
      });
    }
  });
  app.put('/api/categories/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, icon } = req.body;

      if (!name) {
        return res.status(422).json({
          success: false,
          error: 'Category name is required.',
        });
      }

      const [existingRows] = await db.execute(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      if ((existingRows as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found.',
        });
      }

      await db.execute(
        `UPDATE categories
       SET name = ?, icon = ?
       WHERE id = ?`,
        [name, icon || 'Utensils', id]
      );

      const [rows] = await db.execute(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Category updated successfully.',
        category: (rows as any[])[0],
      });
    } catch (error) {
      console.error('❌ Failed to update category:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to update category in database.',
      });
    }
  });
  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);

      const [existingRows] = await db.execute(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      if ((existingRows as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found.',
        });
      }

      await db.execute(
        'DELETE FROM categories WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Category deleted successfully.',
      });
    } catch (error) {
      console.error('❌ Failed to delete category:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete category from database.',
      });
    }
  });
  // 5. Cart / Calculation
  app.post('/api/cart/calculate', (req, res) => {
    const { items = [], order_type = 'delivery', tip_type = 'none', custom_tip_amount = 0, distance_km = 0 } = req.body;

    let subtotal = 0;
    for (const item of items) {
      const basePrice = Number(item.price) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      const addOnsTotal = (item.add_ons || []).reduce((sum: number, a: { price: number }) => sum + Number(a.price || 0), 0);
      subtotal += (basePrice + addOnsTotal) * qty;
    }

    let delivery_fee = 0;
    if (order_type === 'delivery') {
      delivery_fee = storeSettings.flat_delivery_fee + Math.max(0, (distance_km - 3) * 20);
    }

    const tax = Math.round(subtotal * storeSettings.tax_rate * 100) / 100;

    let tip = 0;
    if (tip_type === '5%') tip = Math.round(subtotal * 0.05);
    else if (tip_type === '10%') tip = Math.round(subtotal * 0.1);
    else if (tip_type === '15%') tip = Math.round(subtotal * 0.15);
    else if (tip_type === 'custom') tip = Math.max(0, Number(custom_tip_amount) || 0);

    const total = Math.round((subtotal + tax + delivery_fee + tip) * 100) / 100;

    res.json({
      success: true,
      breakdown: {
        subtotal,
        tax_rate: storeSettings.tax_rate,
        tax,
        delivery_fee,
        tip,
        total,
        order_type,
      },
    });
  });

  // 6. Orders (Online Delivery / Pickup)
  app.get('/api/orders', async (req, res) => {
    try {
      let query = `
      SELECT
        o.*,
        oi.product_id,
        oi.product_title,
        oi.quantity,
        oi.add_ons_json,
        oi.price AS item_price
      FROM orders o
      LEFT JOIN order_items oi
        ON o.id = oi.order_id
    `;

      const params: any[] = [];

      if (req.query.user_id) {
        query += ` WHERE o.user_id = ?`;
        params.push(Number(req.query.user_id));
      }

      query += ` ORDER BY o.id DESC`;

      const [rows] = await db.execute(query, params);

      const ordersMap = new Map<number, any>();

      for (const row of rows as any[]) {
        if (!ordersMap.has(row.id)) {
          ordersMap.set(row.id, {
            ...row,
            subtotal: Number(row.subtotal),
            tax: Number(row.tax),
            tip: Number(row.tip),
            delivery_fee: Number(row.delivery_fee),
            total: Number(row.total),

            cash_given:
              row.cash_given !== null
                ? Number(row.cash_given)
                : undefined,

            change_returned:
              row.change_returned !== null
                ? Number(row.change_returned)
                : undefined,

            items: [],
          });
        }

        if (row.product_title || row.product_id) {
          ordersMap.get(row.id).items.push({
            product_id: row.product_id,
            title: row.product_title,
            quantity: Number(row.quantity),
            price: Number(row.item_price),
            add_ons: row.add_ons_json
              ? JSON.parse(row.add_ons_json)
              : [],
          });
        }
      }

      res.json({
        success: true,
        orders: Array.from(ordersMap.values()),
      });

    } catch (error) {
      console.error('❌ Failed to load orders:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to load orders from database.',
      });
    }
  });
  app.post('/api/orders', async (req, res) => {
    try {
      if (!storeSettings.is_open) {
        return res.status(403).json({
          success: false,
          error: 'The restaurant is currently CLOSED. Please try again during opening hours.',
        });
      }

      const {
        user_id,
        order_type,
        customer_name,
        customer_phone,
        delivery_address,
        lat_long,
        items,
        subtotal,
        tax,
        tip,
        delivery_fee,
        total,
        payment_method,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'Cart is empty.',
        });
      }

      if (order_type === 'delivery' && !delivery_address) {
        return res.status(422).json({
          success: false,
          error: 'Please enter a delivery address.',
        });
      }

      const finalOrderType = order_type || 'delivery';

      const finalAddress =
        finalOrderType === 'delivery'
          ? delivery_address
          : 'Customer In-Store Pickup Counter';
      console.log('========== ORDER DEBUG ==========');
      console.log('user_id from request:', user_id);
      console.log('user_id type:', typeof user_id);
      console.log('=================================');
      const paymentStatus =
        payment_method === 'online'
          ? 'paid'
          : 'cash_on_delivery';
      console.log('ORDER USER ID:', user_id);
      // 1. Create order
      const [orderResult] = await db.execute(
        `INSERT INTO orders
        (
          user_id,
          order_type,
          customer_name,
          customer_phone,
          delivery_address,
          lat_long,
          subtotal,
          tax,
          tip,
          delivery_fee,
          total,
          payment_status,
          status
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          null,
          finalOrderType,
          customer_name || 'Online Customer',
          customer_phone || '+92 300 0000000',
          finalAddress,
          lat_long || null,
          Number(subtotal),
          Number(tax),
          Number(tip),
          Number(delivery_fee),
          Number(total),
          paymentStatus,
          'received',
        ]
      );

      const insertResult = orderResult as any;
      const orderId = insertResult.insertId;

      // 2. Save order items
      for (const item of items) {
        await db.execute(
          `INSERT INTO order_items
          (
            order_id,
            product_id,
            product_title,
            quantity,
            add_ons_json,
            price
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id || null,
            item.title,
            Number(item.quantity),
            JSON.stringify(item.add_ons || []),
            Number(item.price),
          ]
        );
      }

      // 3. Get the newly created order
      const [orderRows] = await db.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      const [itemRows] = await db.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
      );

      const order = (orderRows as any[])[0];

      const savedItems = (itemRows as any[]).map((item) => ({
        product_id: item.product_id,
        title: item.product_title,
        quantity: Number(item.quantity),
        price: Number(item.price),
        add_ons:
          typeof item.add_ons_json === 'string'
            ? JSON.parse(item.add_ons_json)
            : item.add_ons_json || [],
      }));

      const newOrder = {
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        tip: Number(order.tip),
        delivery_fee: Number(order.delivery_fee),
        total: Number(order.total),
        items: savedItems,
      };

      res.json({
        success: true,
        message: 'Order placed successfully! Kitchen has received your order.',
        order: newOrder,
      });

    } catch (error) {
      console.error('❌ Failed to create order:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to save order to database.',
      });
    }
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const order = orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (status) order.status = status;
    res.json({ success: true, order });
  });

  // 7. Cashier POS Orders
  app.post('/api/pos/order', (req, res) => {
    const { customer_name, customer_phone, items, cash_given, tip = 0 } = req.body;
    if (!items || items.length === 0) {
      return res.status(422).json({ success: false, error: 'No items in POS ticket.' });
    }

    let subtotal = 0;
    for (const item of items) {
      const basePrice = Number(item.price) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      const addOnsTotal = (item.add_ons || []).reduce((sum: number, a: { price: number }) => sum + Number(a.price || 0), 0);
      subtotal += (basePrice + addOnsTotal) * qty;
    }

    const tax = Math.round(subtotal * storeSettings.tax_rate * 100) / 100;
    const total = Math.round((subtotal + tax + Number(tip)) * 100) / 100;
    const cash = Number(cash_given);

    if (cash < total) {
      return res.status(422).json({
        success: false,
        error: `Insufficient cash. Total is Rs. ${total.toLocaleString()}, received Rs. ${cash.toLocaleString()}.`,
      });
    }

    const change_returned = Math.round((cash - total) * 100) / 100;

    const newOrder: Order = {
      id: Math.max(...orders.map((o) => o.id), 100) + 1,
      user_id: null,
      order_type: 'pos',
      customer_name: customer_name || 'Walk-In Customer',
      customer_phone: customer_phone || 'Walk-In',
      delivery_address: 'In-Store POS Counter',
      subtotal,
      tax,
      tip: Number(tip),
      delivery_fee: 0,
      total,
      cash_given: cash,
      change_returned,
      payment_status: 'paid',
      items: items.map((i: any) => ({
        title: i.title,
        quantity: i.quantity,
        price: i.price,
        add_ons: i.add_ons || [],
      })),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    orders.push(newOrder);

    res.json({
      success: true,
      message: 'POS Order submitted successfully.',
      receipt: newOrder,
    });
  });

  // 8. Operational Expenses
  app.get('/api/expenses', (req, res) => {
    res.json({
      success: true,
      expenses: [...expenses].reverse(),
    });
  });

  app.post('/api/expenses', (req, res) => {
    const { title, category, amount, date } = req.body;
    if (!title || !amount) {
      return res.status(422).json({ success: false, error: 'Expense title and amount are required.' });
    }

    const newExpense: Expense = {
      id: Math.max(...expenses.map((e) => e.id), 0) + 1,
      title,
      category: category || 'General Operations',
      amount: Number(amount),
      date: date || new Date().toISOString().substring(0, 10),
      created_at: new Date().toISOString(),
    };

    expenses.push(newExpense);

    res.json({
      success: true,
      message: 'Expense recorded.',
      expense: newExpense,
    });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = expenses.findIndex((e) => e.id === id);
    if (index !== -1) {
      expenses.splice(index, 1);
    }
    res.json({ success: true, message: 'Expense deleted.' });
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      // Total revenue + orders
      const [revenueRows] = await db.execute(`
      SELECT
        COALESCE(SUM(total), 0) AS totalRevenue,
        COUNT(*) AS totalOrders
      FROM orders
    `);

      // Online revenue + orders
      const [onlineRows] = await db.execute(`
      SELECT
        COALESCE(SUM(total), 0) AS onlineRevenue,
        COUNT(*) AS onlineOrdersCount
      FROM orders
      WHERE order_type IN ('delivery', 'pickup')
    `);

      // POS revenue + orders
      const [posRows] = await db.execute(`
      SELECT
        COALESCE(SUM(total), 0) AS inStoreRevenue,
        COUNT(*) AS posOrdersCount
      FROM orders
      WHERE order_type = 'pos'
    `);

      // Expenses
      const [expenseRows] = await db.execute(`
      SELECT
        COALESCE(SUM(amount), 0) AS totalExpenses
      FROM expenses
    `);

      // Top selling dishes
      const [topDishRows] = await db.execute(`
      SELECT
        oi.product_title AS title,
        COALESCE(SUM(oi.quantity), 0) AS count,
        COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
      FROM order_items oi
      GROUP BY oi.product_title
      ORDER BY count DESC
      LIMIT 5
    `);

      const revenue = (revenueRows as any[])[0];
      const online = (onlineRows as any[])[0];
      const pos = (posRows as any[])[0];
      const expenses = (expenseRows as any[])[0];

      const totalRevenue = Number(revenue.totalRevenue);
      const totalOrders = Number(revenue.totalOrders);

      const onlineRevenue = Number(online.onlineRevenue);
      const onlineOrdersCount = Number(online.onlineOrdersCount);

      const inStoreRevenue = Number(pos.inStoreRevenue);
      const posOrdersCount = Number(pos.posOrdersCount);

      const totalExpenses = Number(expenses.totalExpenses);

      const netProfit = totalRevenue - totalExpenses;

      const averageOrderValue =
        totalOrders > 0
          ? totalRevenue / totalOrders
          : 0;

      const topSellingDishes = (topDishRows as any[]).map((dish) => ({
        title: dish.title,
        count: Number(dish.count),
        revenue: Number(dish.revenue),
      }));

      const analytics = {
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

      res.json({
        success: true,
        analytics,
      });

    } catch (error) {
      console.error('❌ Failed to load analytics:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to load analytics from database.',
      });
    }
  });

  app.get('/api/analytics/ai', async (req, res) => {
    const analytics = calculateAnalytics();
    const aiSummary = await generateSalesAnalyticsSummary(analytics);
    res.json({
      success: true,
      summary: aiSummary,
      analytics,
    });
  });

  // 10. Export CSV Report
  app.get('/api/analytics/export', (req, res) => {
    const analytics = calculateAnalytics();
    const rows = [
      ['=== ZAFFRAN RESTAURANT FINANCIAL & DUAL-TRACK REPORT ==='],
      ['Generated Date', new Date().toISOString()],
      [''],
      ['Metric', 'Amount (PKR)'],
      ['Gross Total Revenue', analytics.totalRevenue.toFixed(2)],
      ['Online Revenue (Delivery & Pickup)', analytics.onlineRevenue.toFixed(2)],
      ['In-Store / POS Revenue', analytics.inStoreRevenue.toFixed(2)],
      ['Total Operational Expenses', analytics.totalExpenses.toFixed(2)],
      ['Net Operating Profit', analytics.netProfit.toFixed(2)],
      ['Total Orders Count', analytics.totalOrders.toString()],
      ['Online Orders Count', analytics.onlineOrdersCount.toString()],
      ['POS Orders Count', analytics.posOrdersCount.toString()],
      ['Average Order Value', analytics.averageOrderValue.toFixed(2)],
      [''],
      ['=== TOP SELLING DISHES ==='],
      ['Dish Title', 'Quantity Sold', 'Revenue (PKR)'],
      ...analytics.topSellingDishes.map((d) => [d.title, d.count.toString(), d.revenue.toFixed(2)]),
      [''],
      ['=== ITEMIZED EXPENSES LOG ==='],
      ['Date', 'Expense Title', 'Category', 'Amount (PKR)'],
      ...expenses.map((e) => [e.date, e.title, e.category, e.amount.toFixed(2)]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="zaffran_sales_report_${Date.now()}.csv"`);
    res.send(csvContent);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zaffran Restaurant Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
