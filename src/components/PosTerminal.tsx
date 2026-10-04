import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Clock,
  UserCheck,
  RotateCcw,
  UtensilsCrossed,
} from 'lucide-react';
import { Product, Category, CartItem, Order, User, StoreSettings } from '../types.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

interface PosTerminalProps {
  products: Product[];
  categories: Category[];
  currentUser: User | null;
  settings: StoreSettings;
  onOrderCompleted: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  categories,
  currentUser,
  settings,
  onOrderCompleted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // POS Ticket State
  const [ticketItems, setTicketItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('N/A');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [tip, setTip] = useState<number>(0);
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'ticket'>('catalog');

  // Custom Off-Menu Item Modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [customItemQty, setCustomItemQty] = useState(1);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Filtered menu items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return ticketItems.reduce((sum, item) => {
      const addOnsPrice = item.add_ons.reduce((aSum, a) => aSum + a.price, 0);
      return sum + (item.price + addOnsPrice) * item.quantity;
    }, 0);
  }, [ticketItems]);

  const tax = useMemo(() => {
    const rate = typeof settings?.tax_rate === 'number' ? settings.tax_rate : 0.05;
    return Math.round(subtotal * rate * 100) / 100;
  }, [subtotal, settings?.tax_rate]);

  const total = useMemo(() => {
    return Math.round((subtotal + tax + Number(tip || 0)) * 100) / 100;
  }, [subtotal, tax, tip]);

  // Change returned calculation
  const changeReturned = useMemo(() => {
    if (cashGiven === '' || Number(cashGiven) < total) return 0;
    return Math.round((Number(cashGiven) - total) * 100) / 100;
  }, [cashGiven, total]);

  // Add catalog item to ticket
  const handleAddItemToTicket = (product: Product) => {
    setTicketItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id && !i.is_custom_item);
      if (existing) {
        return prev.map((i) =>
          i.cart_item_id === existing.cart_item_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        const newItem: CartItem = {
          cart_item_id: `pos_${Date.now()}_${product.id}`,
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          add_ons: [],
        };
        return [...prev, newItem];
      }
    });
  };

  // Add custom off-menu item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemTitle || !customItemPrice) return;

    const newItem: CartItem = {
      cart_item_id: `custom_${Date.now()}`,
      title: `${customItemTitle} (Off-Menu)`,
      price: Number(customItemPrice),
      quantity: Math.max(1, customItemQty),
      add_ons: [],
      is_custom_item: true,
    };

    setTicketItems((prev) => [...prev, newItem]);
    setShowCustomItemModal(false);
    setCustomItemTitle('');
    setCustomItemPrice('');
    setCustomItemQty(1);
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.cart_item_id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setTicketItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('N/A');
    setCashGiven('');
    setTip(0);
    setErrorMsg('');
  };

  // Quick denomination cash filler
  const setQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  // Submit in-store POS order
  const handleSubmitPosOrder = async () => {
    setErrorMsg('');

    if (ticketItems.length === 0) {
      setErrorMsg('Cannot submit empty POS ticket.');
      return;
    }

    if (cashGiven === '' || Number(cashGiven) < total) {
      setErrorMsg(`Insufficient cash tendered. Total is Rs. ${total.toLocaleString()}, received Rs. ${cashGiven || 0}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: ticketItems,
        cash_given: Number(cashGiven),
        tip: Number(tip || 0),
      };

      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit in-store POS order.');
      }

      setCompletedOrder(data.receipt);
      onOrderCompleted();
      handleClearTicket();
    } catch (err: any) {
      setErrorMsg(err.message || 'POS transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="pos-terminal-root" className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Banner / Cashier Station Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                In-Store Cashier POS Register
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Terminal: Counter #1 • Logged in as{' '}
              <strong className="text-amber-400">
                {currentUser?.first_name || 'Cashier Bilal'} ({currentUser?.role?.toUpperCase() || 'CASHIER'})
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomItemModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Custom Off-Menu Item</span>
          </button>
          <button
            onClick={handleClearTicket}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title="Reset active ticket"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Ticket</span>
          </button>
        </div>
      </div>

      {/* Mobile Screen Segment Tab (Hidden on desktop lg:) */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 mb-4">
        <button
          onClick={() => setMobilePosTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobilePosTab === 'catalog'
              ? 'bg-amber-500 text-stone-950 shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu Catalog ({products.length})</span>
        </button>
        <button
          onClick={() => setMobilePosTab('ticket')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobilePosTab === 'ticket'
              ? 'bg-amber-500 text-stone-950 shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Ticket ({ticketItems.reduce((sum, i) => sum + i.quantity, 0)})</span>
        </button>
      </div>

      {/* POS Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16 lg:pb-0">
        {/* Left Column: Menu Items Grid (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobilePosTab === 'ticket' ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Categories */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search dish by name (e.g. Pulao, Kabab, Chany, Roast)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAddItemToTicket(product)}
                className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/60 transition-all text-left flex flex-col justify-between group shadow"
              >
                <div className="space-y-1.5">
                  <div className="h-24 w-full rounded-lg overflow-hidden bg-stone-950">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="font-semibold text-xs text-stone-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {product.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 mt-2">
                  <span className="font-extrabold text-xs text-amber-400">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  <span className="p-1 rounded bg-stone-800 text-stone-300 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Column: Active In-Store Ticket & Cash Register (5 cols) */}
        <div className={`lg:col-span-5 rounded-2xl bg-stone-900/95 border border-stone-800 p-4 sm:p-5 flex-col justify-between shadow-2xl space-y-4 ${mobilePosTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Ticket Header & Customer Details */}
          <div className="space-y-3 pb-3 border-b border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobilePosTab('catalog')}
                  className="lg:hidden px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold"
                >
                  ← Menu
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Active In-Store Ticket
                </span>
              </div>
              <span className="text-[11px] text-stone-400">
                {ticketItems.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Customer / Table</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Table 4 / Walk-in"
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Contact Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
            {ticketItems.length === 0 ? (
              <div className="py-10 text-center text-stone-500 text-xs">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-600 mb-2 stroke-[1.5]" />
                <p>Click menu items on the left to add to ticket</p>
              </div>
            ) : (
              ticketItems.map((item) => (
                <div
                  key={item.cart_item_id}
                  className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-200 truncate">{item.title}</p>
                    <p className="text-[10px] text-amber-400 font-medium">
                      Rs. {item.price.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQty(item.cart_item_id, -1)}
                      className="w-5 h-5 rounded bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.cart_item_id, 1)}
                      className="w-5 h-5 rounded bg-amber-500 text-stone-950 font-bold flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-bold text-stone-100 w-16 text-right">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.cart_item_id)}
                    className="text-stone-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Billing Calculations & Cash Calculator */}
          <div className="space-y-3 pt-3 border-t border-stone-800">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 font-medium">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="text-stone-200 font-medium">Rs. {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-stone-800">
                <span>Total Amount Due</span>
                <span className="text-amber-400 font-serif">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Cash Given & Quick Denomination Buttons */}
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  Cash Given by Customer (Rs.)
                </label>
                <button
                  type="button"
                  onClick={() => setQuickCash(total)}
                  className="text-[10px] text-amber-400 hover:underline font-semibold"
                >
                  Exact (Rs. {total})
                </button>
              </div>

              <input
                type="number"
                min="0"
                step="50"
                placeholder="Enter tendered cash..."
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm font-bold text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />

              {/* Quick bill buttons */}
              <div className="flex gap-1.5 pt-1">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickCash(amt)}
                    className="flex-1 py-1 rounded bg-stone-900 hover:bg-stone-800 text-[10px] font-semibold text-stone-300 border border-stone-800 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* Change Returned Highlight */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                <span className="font-semibold text-stone-300">Change to Return:</span>
                <span
                  className={`text-sm font-extrabold ${
                    cashGiven !== '' && Number(cashGiven) >= total
                      ? 'text-emerald-400 animate-pulse'
                      : 'text-stone-500'
                  }`}
                >
                  Rs. {changeReturned.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit in-store order button */}
            <button
              onClick={handleSubmitPosOrder}
              disabled={isSubmitting || ticketItems.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording POS Sale...' : 'Submit & Print POS Receipt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Review Ticket Bar */}
      {mobilePosTab === 'catalog' && ticketItems.length > 0 && (
        <div className="lg:hidden fixed bottom-4 inset-x-4 z-30">
          <button
            onClick={() => setMobilePosTab('ticket')}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-between shadow-2xl shadow-amber-950/60 active:scale-98 transition-all border border-amber-300/40"
          >
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Review Ticket ({ticketItems.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
            </div>
            <span className="font-extrabold text-sm">Rs. {total.toLocaleString()} →</span>
          </button>
        </div>
      )}

      {/* Custom Off-Menu Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161822] border border-stone-800 p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Add Custom Off-Menu Item</h4>
            <p className="text-xs text-stone-400">
              For custom requests, daily chef specials, or personalized catering items.
            </p>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Half Namak Mandi Shinwari"
                  value={customItemTitle}
                  onChange={(e) => setCustomItemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1200"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
                >
                  Add to Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal on POS Submit */}
      {completedOrder && (
        <ReceiptModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </div>
  );
};
