import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Store,
  DollarSign,
  Utensils,
  Receipt,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Pencil,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  Expense,
  StoreSettings,
  SalesAnalytics,
  AIReportSummary,
  User,
} from '../types.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  currentUser: User | null;
  onRefreshData: () => void;
  onUpdateSettings: (newSettings: StoreSettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  settings,
  currentUser,
  onRefreshData,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'financials' | 'menu' | 'expenses' | 'orders'>('financials');

  // Live state fetched from server
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [aiReport, setAiReport] = useState<AIReportSummary | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'online' | 'pos'>('all');

  // Modals & Forms
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showMonthlyStatementModal, setShowMonthlyStatementModal] = useState(false);

  // Form states
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdCatId, setNewProdCatId] = useState<number>(categories[0]?.id || 1);
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdStatus, setNewProdStatus] = useState<'available' | 'out_of_stock'>('available');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('Raw Materials');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().substring(0, 10));

  const [notification, setNotification] = useState<string | null>(null);

  // Fetch live dashboard metrics
  const fetchDashboardData = async () => {
    try {
      const [resAnalytics, resOrders, resExpenses] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders'),
        fetch('/api/expenses'),
      ]);

      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data.analytics);
      }
      if (resOrders.ok) {
        const data = await resOrders.json();
        setAllOrders(data.orders);
      }
      if (resExpenses.ok) {
        const data = await resExpenses.json();
        setAllExpenses(data.expenses);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Shop Status Global Toggle
  const handleToggleShopStatus = async () => {
    try {
      const newStatus = !Boolean(settings?.is_open);
      const res = await fetch('/api/store-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateSettings({ ...(settings || {}), is_open: newStatus });
        triggerNotification(`Restaurant is now globally ${newStatus ? 'OPEN' : 'CLOSED'}.`);
      }
    } catch {
      triggerNotification('Failed to update shop status.');
    }
  };

  // 2. Run AI Analytics
  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/analytics/ai');
      const data = await res.json();
      if (data.success) {
        setAiReport(data.summary);
        triggerNotification('AI sales & margin audit completed.');
      }
    } catch (err) {
      triggerNotification('Failed to run AI audit.');
    } finally {
      setIsAiLoading(false);
    }
  };



  // 5. Toggle Product Availability
  const handleToggleProductStatus = async (
    id: number,
    status: 'available' | 'out_of_stock'
  ) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        triggerNotification(
          status === 'available'
            ? 'Dish is now available.'
            : 'Dish marked as sold out.'
        );

        onRefreshData();
      } else {
        triggerNotification(data.error || 'Failed to update dish status.');
      }
    } catch (error) {
      console.error(error);
      triggerNotification('Failed to update dish status.');
    }
  };
  // 3. Create Product
  // 3. Create / Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProdTitle || !newProdPrice) return;

    try {
      const isEditing = editingProduct !== null;

      const url = isEditing
        ? `/api/products/${editingProduct.id}`
        : '/api/products';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProdTitle,
          category_id: newProdCatId,
          price: Number(newProdPrice),
          description: newProdDesc,
          image_url:
            newProdImg ||
            'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
          status: newProdStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        triggerNotification(
          isEditing
            ? 'Dish updated successfully.'
            : 'Product added to menu.'
        );

        setShowAddProductModal(false);

        setEditingProduct(null);
        setNewProdTitle('');
        setNewProdPrice('');
        setNewProdDesc('');
        setNewProdImg('');
        setNewProdStatus('available');

        onRefreshData();
      } else {
        triggerNotification(data.error || 'Failed to save dish.');
      }
    } catch (error) {
      console.error(error);
      triggerNotification('Failed to save product.');
    }
  };

  // 4. Delete Product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dish from the menu?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Dish removed.');
        onRefreshData();
      }
    } catch {
      triggerNotification('Failed to delete dish.');
    }
  };
  // 4. Edit Product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);

    setNewProdTitle(product.title);
    setNewProdCatId(product.category_id);
    setNewProdPrice(product.price);
    setNewProdDesc(product.description || '');
    setNewProdImg(product.image_url || '');
    setNewProdStatus(product.status);

    setShowAddProductModal(true);
  };

  // 5. Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        triggerNotification('Category created.');
        setShowAddCategoryModal(false);
        setNewCategoryName('');
        onRefreshData();
      }
    } catch {
      triggerNotification('Failed to create category.');
    }
  };

  // 6. Delete Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category? Associated items may be affected.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Category deleted.');
        onRefreshData();
      }
    } catch {
      triggerNotification('Failed to delete category.');
    }
  };

  // 7. Create Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle || !newExpenseAmount) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExpenseTitle,
          category: newExpenseCategory,
          amount: Number(newExpenseAmount),
          date: newExpenseDate,
        }),
      });
      if (res.ok) {
        triggerNotification('Expense recorded.');
        setShowAddExpenseModal(false);
        setNewExpenseTitle('');
        setNewExpenseAmount('');
        fetchDashboardData();
      }
    } catch {
      triggerNotification('Failed to record expense.');
    }
  };

  // 8. Delete Expense
  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('Expense removed.');
        fetchDashboardData();
      }
    } catch {
      triggerNotification('Failed to remove expense.');
    }
  };

  // Filtered Orders
  const filteredOrders = allOrders.filter((o) => {
    if (orderFilter === 'online') return o.order_type === 'delivery' || o.order_type === 'pickup';
    if (orderFilter === 'pos') return o.order_type === 'pos';
    return true;
  });

  return (
    <div id="admin-dashboard-root" className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Bar: Admin Identity & Global Shop Status Control */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-white tracking-tight">
              Executive Restaurant Management & Analytics
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Admin Session: <strong className="text-stone-200">{currentUser?.email || 'admin@savourpulao.com'}</strong> • Dual-Track Accounting Active
            </p>
          </div>
        </div>

        {/* Global Shop Open / Closed Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400">Store Status:</span>
            <span
              className={`font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 ${Boolean(settings?.is_open)
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${Boolean(settings?.is_open) ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              {Boolean(settings?.is_open) ? 'STORE IS OPEN' : 'STORE IS CLOSED'}
            </span>
          </div>

          <button
            onClick={handleToggleShopStatus}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${Boolean(settings?.is_open)
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
          >
            {Boolean(settings?.is_open) ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Close Restaurant Globally</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Open Restaurant Globally</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-stone-900/90 p-1 border border-stone-800 text-xs font-semibold overflow-x-auto scrollbar-none gap-1 -mx-2 px-2 sm:mx-0 sm:px-1">
        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap ${activeTab === 'financials'
            ? 'bg-amber-500 text-stone-950 font-bold shadow'
            : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dual-Track Financials<span className="hidden md:inline"> &amp; AI Analytics</span></span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap ${activeTab === 'menu'
            ? 'bg-amber-500 text-stone-950 font-bold shadow'
            : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu &amp; Catalog ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap ${activeTab === 'expenses'
            ? 'bg-amber-500 text-stone-950 font-bold shadow'
            : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Receipt className="w-4 h-4" />
          <span><span className="hidden sm:inline">Operating </span>Expenses ({allExpenses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap ${activeTab === 'orders'
            ? 'bg-amber-500 text-stone-950 font-bold shadow'
            : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Order History<span className="hidden md:inline"> &amp; Verification</span> ({allOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: DUAL-TRACK FINANCIALS & AI SALES ANALYTICS */}
      {activeTab === 'financials' && analytics && (
        <div className="space-y-6">
          {/* Dual-Track Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Total Revenue */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Gross Total Revenue</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-white font-serif mt-2">
                Rs. {analytics.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400">
                <span>Total Fulfillments:</span>
                <strong className="text-stone-200 font-semibold">{analytics.totalOrders} Orders</strong>
              </div>
            </div>

            {/* Online Revenue Track */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Online Revenue (Delivery & Pickup)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                  {analytics.totalRevenue > 0
                    ? `${Math.round((analytics.onlineRevenue / analytics.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-blue-400 font-serif mt-2">
                Rs. {analytics.onlineRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400">
                <span>Digital Channels:</span>
                <strong className="text-stone-200 font-semibold">{analytics.onlineOrdersCount} orders</strong>
              </div>
            </div>

            {/* In-Store POS Revenue Track */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>In-Store POS Revenue</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  {analytics.totalRevenue > 0
                    ? `${Math.round((analytics.inStoreRevenue / analytics.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-amber-400 font-serif mt-2">
                Rs. {analytics.inStoreRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400">
                <span>Cash Register:</span>
                <strong className="text-stone-200 font-semibold">{analytics.posOrdersCount} walk-in orders</strong>
              </div>
            </div>

            {/* Net Operating Profit */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Net Operating Profit</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${analytics.netProfit >= 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                    }`}
                >
                  {analytics.netProfit >= 0 ? 'SURPLUS' : 'DEFICIT'}
                </span>
              </div>
              <p
                className={`text-2xl font-extrabold font-serif mt-2 ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
              >
                Rs. {analytics.netProfit.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400">
                <span>Less Expenses:</span>
                <strong className="text-stone-200 font-semibold">
                  Rs. {analytics.totalExpenses.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* End-of-Month Offline Export & Action Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-900/80 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                End-of-Month Audit & Offline Reporting Package
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Generate downloadable offline records for accounting, taxation, and stakeholder reviews.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href="/api/analytics/export"
                download="savour_pulao_monthly_report.csv"
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700/60"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV Spreadsheet</span>
              </a>
              <button
                onClick={() => setShowMonthlyStatementModal(true)}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generate PDF / Print Report</span>
              </button>
            </div>
          </div>

          {/* Top Selling Dishes & AI Engine Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Selling Dishes Table (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Top-Performing Menu Dishes
                </h3>
                <span className="text-[11px] text-stone-400">By Sales Volume</span>
              </div>

              <div className="space-y-3">
                {analytics.topSellingDishes.map((dish, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-800 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-stone-100">{dish.title}</p>
                        <p className="text-[11px] text-stone-400">{dish.count} portions sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-400">
                      Rs. {dish.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Assisted Sales Analytics & Insights (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900/95 to-amber-950/20 border border-stone-800 shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      AI-Assisted Sales Analytics Engine
                    </h3>
                    <p className="text-[10px] text-stone-400">Powered by Gemini 3.8 Flash</p>
                  </div>
                </div>

                <button
                  onClick={handleRunAiAnalysis}
                  disabled={isAiLoading}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'Synthesizing...' : 'Run Live AI Audit'}</span>
                </button>
              </div>

              {aiReport ? (
                <div className="space-y-4 text-xs pt-1">
                  <div className="p-3.5 rounded-xl bg-stone-950/90 border border-amber-500/30">
                    <h4 className="font-bold text-amber-300 text-sm">{aiReport.headline}</h4>
                    <p className="text-stone-300 mt-1 leading-relaxed text-[11px]">
                      {aiReport.executiveSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                      <h5 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                        Operational Strengths
                      </h5>
                      <ul className="space-y-1 text-stone-300 text-[11px]">
                        {aiReport.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                      <h5 className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                        Revenue Opportunities
                      </h5>
                      <ul className="space-y-1 text-stone-300 text-[11px]">
                        {aiReport.growthOpportunities.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                    <h5 className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">
                      Inventory & Kitchen Prep Advisory
                    </h5>
                    <ul className="space-y-1 text-stone-300 text-[11px]">
                      {aiReport.inventoryAdvice.map((inv, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{inv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-stone-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-amber-500/70 animate-pulse stroke-[1.5]" />
                  <p className="font-semibold text-stone-200">AI Analytics Ready</p>
                  <p className="text-xs max-w-sm mx-auto text-stone-400">
                    Click "Run Live AI Audit" above to analyze sales patterns, margin trends, and peak hour dish attachments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & DISH CATALOG MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Menu & Dish Catalog</h2>
              <p className="text-xs text-stone-400">
                Add, modify pricing, upload dish imagery, or toggle availability status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Category</span>
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProdTitle('');
                  setNewProdCatId(categories[0]?.id || 1);
                  setNewProdPrice('');
                  setNewProdDesc('');
                  setNewProdImg('');
                  setNewProdStatus('available');
                  setShowAddProductModal(true);
                }}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Dish Item</span>
              </button>
            </div>
          </div>

          {/* Categories Bar */}
          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px] pl-1">
              Categories:
            </span>
            {categories.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-stone-400 hover:text-rose-400 ml-1"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Products Grid */}
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const catName =
                categories.find((c) => c.id === p.category_id)?.name || 'General';

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-20 h-20 rounded-xl object-cover bg-stone-950 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-semibold">
                        {catName}
                      </span>

                      <h4 className="font-bold text-sm text-stone-100 mt-1 line-clamp-1">
                        {p.title}
                      </h4>

                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Price + Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-xs">
                    <div>
                      <span className="font-extrabold text-amber-400 text-sm">
                        Rs. {p.price.toLocaleString()}
                      </span>

                      <span
                        className={`ml-2 text-[10px] font-bold ${p.status === 'available'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                          }`}
                      >
                        {p.status === 'available'
                          ? '● Available'
                          : '○ Sold Out'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {/* Edit */}
                    <button
                      onClick={() => handleEditProduct(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-stone-950 transition-colors text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {/* Stock Toggle */}
                    <button
                      onClick={() =>
                        handleToggleProductStatus(
                          p.id,
                          p.status === 'available' ? 'out_of_stock' : 'available'
                        )
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors text-xs font-semibold ${p.status === 'available'
                        ? 'bg-rose-950/60 text-rose-400 hover:bg-rose-900'
                        : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900'
                        }`}
                    >
                      {p.status === 'available' ? 'Sold Out' : 'Available'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-3 py-2 rounded-lg bg-stone-800 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Remove dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Daily Operational Expenditures</h2>
              <p className="text-xs text-stone-400">
                Log procurement, kitchen meat, gas, utilities, and daily staff wages.
              </p>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record New Expense</span>
            </button>
          </div>

          <div className="rounded-2xl bg-stone-900/90 border border-stone-800 shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/80 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {allExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-400">{exp.date}</td>
                      <td className="py-3 px-4 font-semibold text-stone-100">{exp.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">
                        Rs. {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-stone-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORDER AUDIT & VERIFICATION */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Live Orders Ledger</h2>
              <p className="text-xs text-stone-400">
                Track incoming online delivery, takeaway pickups, and in-store cashier sales.
              </p>
            </div>
            {/* Filter */}
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-900 p-1 border border-stone-800 text-xs">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-md ${orderFilter === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
                  }`}
              >
                All Orders ({allOrders.length})
              </button>
              <button
                onClick={() => setOrderFilter('online')}
                className={`px-3 py-1.5 rounded-md ${orderFilter === 'online' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
                  }`}
              >
                Online
              </button>
              <button
                onClick={() => setOrderFilter('pos')}
                className={`px-3 py-1.5 rounded-md ${orderFilter === 'pos' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
                  }`}
              >
                In-Store POS
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-stone-900/90 border border-stone-800 shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/80 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Pathway</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Total (PKR)</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">#{ord.id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ord.order_type === 'pos'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : ord.order_type === 'delivery'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                        >
                          {ord.order_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-stone-100">{ord.customer_name}</p>
                        <p className="text-[10px] text-stone-400">{ord.customer_phone}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-stone-300">
                        {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        Rs. {ord.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 font-semibold text-[11px] transition-colors"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PRODUCT */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#161822] border border-stone-800 p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">
              {editingProduct ? 'Edit Dish' : 'Add New Dish to Menu'}
            </h4>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Dish Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Shinwari Karahi"
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category *</label>
                  <select
                    value={newProdCatId}
                    onChange={(e) => setNewProdCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1650"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe cuts, marinades, spices..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImg}
                  onChange={(e) => setNewProdImg(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
                >
                  {editingProduct ? 'Update Dish' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161822] border border-stone-800 p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Create New Category</h4>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood & Fish Specials"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161822] border border-stone-800 p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Record Operating Expense</h4>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooking Oil & Spices Restock"
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category</label>
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Utilities">Utilities (Gas/Elec)</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Wages">Staff Daily Wages</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="3500"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newExpenseDate}
                  onChange={(e) => setNewExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE MONTHLY STATEMENT */}
      {showMonthlyStatementModal && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white text-stone-900 shadow-2xl p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Official Monthly Financial Report
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-1.5 px-3 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowMonthlyStatementModal(false)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="pt-6 font-sans space-y-6 text-xs">
              <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-stone-900 uppercase">
                    Savour Pulao &amp; Chany
                  </h2>
                  <p className="text-stone-600 mt-1">Dual-Track Financial Statement &amp; Monthly Audit</p>
                  <p className="text-stone-500 text-[11px]">Branches: Blue Area Islamabad • Saddar Rawalpindi • Shadman Lahore</p>
                </div>
                <div className="text-right text-[11px] text-stone-600 space-y-0.5">
                  <p>Statement Period: <strong>Current Billing Month</strong></p>
                  <p>Generated: <strong>{new Date().toLocaleDateString()}</strong></p>
                  <p>Accounting Mode: <strong>Cash + Accrual</strong></p>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-semibold">Gross Revenue</p>
                  <p className="text-lg font-bold text-stone-900 mt-0.5">
                    Rs. {analytics.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-semibold">Total Expenses</p>
                  <p className="text-lg font-bold text-rose-600 mt-0.5">
                    Rs. {analytics.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-semibold">Net Operating Profit</p>
                  <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                    Rs. {analytics.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Dual-Track Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-stone-800">
                  Channel Revenue Breakdown
                </h4>
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden">
                  <div className="flex justify-between p-2.5">
                    <span>Digital Ordering (Home Delivery & Takeaway Pickups)</span>
                    <span className="font-bold">Rs. {analytics.onlineRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span>In-Store Walk-In Dining & Cashier POS Sales</span>
                    <span className="font-bold">Rs. {analytics.inStoreRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-stone-100 font-bold">
                    <span>Total Channel Realization</span>
                    <span>Rs. {analytics.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Top Dishes */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-stone-800">
                  Top Revenue Drivers (Dishes)
                </h4>
                <div className="border border-stone-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-600">
                      <tr>
                        <th className="p-2">Rank & Title</th>
                        <th className="p-2 text-center">Volume</th>
                        <th className="p-2 text-right">Gross Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {analytics.topSellingDishes.map((d, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">#{i + 1} {d.title}</td>
                          <td className="p-2 text-center">{d.count} units</td>
                          <td className="p-2 text-right font-bold">Rs. {d.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-500">
                <p>Authorized Signature: _______________________ (Manager / Controller)</p>
                <p>Stamp & Seal Verified</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
