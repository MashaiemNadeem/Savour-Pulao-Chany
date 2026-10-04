import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Flame,
  Plus,
  Sparkles,
  ShoppingBag,
  Star,
  Clock,
  ShieldCheck,
  UtensilsCrossed,
  SlidersHorizontal,
  ChevronRight,
  History,
  RotateCcw,
} from 'lucide-react';
import { Product, Category, User, StoreSettings, CartItem } from '../types.ts';
import { OrderHistory } from './OrderHistory.tsx';

interface CustomerPortalProps {
  products: Product[];
  categories: Category[];
  currentUser: User | null;
  settings: StoreSettings;
  onOpenDishCustomizer: (product: Product) => void;
  onOpenCart: () => void;
  cartCount: number;
  onRequireAuth: () => void;
  onReOrderItems: (items: CartItem[], toastMsg?: string) => void;
  activeCustomerTab?: 'home' | 'menu' | 'history';
  onTabChange?: (tab: 'home' | 'menu' | 'history') => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  products,
  categories,
  currentUser,
  settings,
  onOpenDishCustomizer,
  onOpenCart,
  cartCount,
  onRequireAuth,
  onReOrderItems,
  activeCustomerTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'home' | 'menu' | 'history'>('menu');
  const activeTab = (activeCustomerTab === 'history' ? 'history' : 'menu');
  const handleTabSwitch = (tab: 'home' | 'menu' | 'history') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState<'default' | 'low_high' | 'high_low'>('default');

  // Filter products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const matchesQuery =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (priceSort === 'low_high') return a.price - b.price;
        if (priceSort === 'high_low') return b.price - a.price;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, priceSort]);

  return (
    <div id="customer-portal-root" className="min-h-screen pb-20">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#18151f] via-[#12141c] to-[#0b0d12] border-b border-amber-900/30 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Savour Pulao &amp; Chany • Iconic National Recipe</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white tracking-tight leading-tight">
              Aged Basmati Yakhni Pulao &amp; <span className="text-amber-400">Lahori Chany</span>
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Authentic long-grain Basmati rice simmered in slow-boiled chicken yakhni broth, golden roast chicken, crispy Shami Kababs, and peppery Lahori Chany in pure desi ghee.
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>25-35 Min Express Dispatch</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>4.9 / 5 Customer Rating</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Halal Certified</span>
              </span>
            </div>
          </div>

          {/* Quick Floating Cart & Order History CTA on Hero */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenCart}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl"
            >
              <ShoppingBag className="w-5 h-5 text-stone-950" />
              <span>View Cart & Checkout</span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-stone-950 text-amber-400 text-xs font-bold">
                  {cartCount} items
                </span>
              )}
            </motion.button>

            <button
              id="hero-order-history-shortcut-btn"
              onClick={() => handleTabSwitch('history')}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 border border-stone-700/80 transition-all shadow"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>My Past Orders & Re-Order</span>
            </button>

            <p className="text-[11px] text-stone-400 mt-1">
              Deliveries active • Cash on delivery & Card supported
            </p>
          </div>
        </div>
      </section>

      {/* Primary Customer Portal Navigation Tabs (Explore Menu vs Order History) */}
      <div className="sticky top-16 z-30 bg-[#12141d]/95 backdrop-blur-md border-b border-stone-800/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="tab-explore-menu-btn"
              onClick={() => handleTabSwitch('menu')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>
                <span className="sm:hidden">Menu</span>
                <span className="hidden sm:inline">Explore Menu</span>
              </span>
            </button>

            <button
              id="tab-order-history-btn"
              onClick={() => handleTabSwitch('history')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>
                <span className="sm:hidden">Order History</span>
                <span className="hidden sm:inline">Order History &amp; Re-Order</span>
              </span>
              {currentUser && (
                <span className={`w-2 h-2 rounded-full ${activeTab === 'history' ? 'bg-stone-950' : 'bg-amber-500'}`} />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
            {currentUser ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Logged in as <strong>{currentUser.first_name}</strong></span>
              </span>
            ) : (
              <button
                onClick={onRequireAuth}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                Sign in to sync your order history →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conditional View: Order History vs Menu Browsing */}
      {activeTab === 'history' ? (
        <OrderHistory
          currentUser={currentUser}
          onRequireAuth={onRequireAuth}
          onReOrderItems={onReOrderItems}
          onBrowseMenu={() => handleTabSwitch('menu')}
        />
      ) : (
        /* Menu Browsing & Filter Bar */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 pb-20 sm:pb-8">
        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Pulao, Kabab, Chany, Roast Chicken)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Price Sorter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={priceSort}
              onChange={(e: any) => setPriceSort(e.target.value)}
              className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
            >
              <option value="default">Default Sort</option>
              <option value="low_high">Price: Low to High</option>
              <option value="high_low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            All Menu ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const cat = categories.find((c) => c.id === product.category_id);
            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-stone-900/90 border border-stone-800/90 overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/50 transition-all"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-950">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />

                  {/* Category pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                    {cat?.name || 'Chef Specialty'}
                  </span>

                  {/* Price tag */}
                  <div className="absolute bottom-2.5 right-3 px-3 py-1 rounded-xl bg-amber-500 text-stone-950 font-extrabold text-xs shadow-md">
                    Rs. {product.price.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Available Add-ons Preview */}
                  {product.available_add_ons && product.available_add_ons.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                        Extras & Pairings:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {product.available_add_ons.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300"
                          >
                            + {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to Cart / Customize CTA */}
                  <button
                    onClick={() => onOpenDishCustomizer(product)}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-all group-hover:border-amber-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Customize & Add to Basket</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-stone-400 space-y-2">
            <UtensilsCrossed className="w-10 h-10 mx-auto text-stone-600 stroke-[1.5]" />
            <p className="font-semibold text-stone-300">No dishes matched your search criteria.</p>
            <p className="text-xs text-stone-400">Try searching for other words or reset category filters.</p>
          </div>
        )}

        {/* Mobile Sticky Floating Cart Bar */}
        {cartCount > 0 && (
          <div className="sm:hidden fixed bottom-4 inset-x-4 z-30">
            <button
              onClick={onOpenCart}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-between shadow-2xl shadow-amber-950/60 active:scale-98 transition-all border border-amber-300/40"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>View Order Basket</span>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-stone-950 text-amber-400 text-[11px] font-bold">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </div>
            </button>
          </div>
        )}
      </section>
      )}
    </div>
  );
};
