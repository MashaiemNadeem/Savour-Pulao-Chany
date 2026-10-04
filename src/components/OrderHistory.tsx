import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  RotateCcw,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Bike,
  Store,
  MapPin,
  Calendar,
  Flame,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import { Order, OrderStatus, User, CartItem, CartItemAddOn } from '../types.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

interface OrderHistoryProps {
  currentUser: User | null;
  onRequireAuth: () => void;
  onReOrderItems: (items: CartItem[], toastMsg?: string) => void;
  onBrowseMenu: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  currentUser,
  onRequireAuth,
  onReOrderItems,
  onBrowseMenu,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch orders for current user
  const fetchUserOrders = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?user_id=${currentUser.id}`);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json().catch(() => null);
          setOrders(data?.orders || []);
        }
      }
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, [currentUser]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Re-order entire historical order
  const handleReOrderEntireOrder = (order: Order) => {
    const cartItemsToAdd: CartItem[] = order.items.map((item, idx) => ({
      cart_item_id: `reorder_${order.id}_${idx}_${Date.now()}`,
      product_id: item.product_id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      add_ons: item.add_ons || [],
      special_instructions: item.special_instructions || '',
    }));

    onReOrderItems(
      cartItemsToAdd,
      `All ${order.items.length} items from Order #${order.id} added to your basket!`
    );
    triggerNotification(`Order #${order.id} reloaded into your basket!`);
  };

  // Re-order single item
  const handleReOrderSingleItem = (item: Order['items'][0], orderId: number) => {
    const singleCartItem: CartItem = {
      cart_item_id: `reorder_single_${orderId}_${Date.now()}`,
      product_id: item.product_id,
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1,
      add_ons: item.add_ons || [],
      special_instructions: item.special_instructions || '',
    };

    onReOrderItems([singleCartItem], `Added "${item.title}" to your basket!`);
    triggerNotification(`"${item.title}" added to your basket!`);
  };

  // Helper for Order Status Pills
  const renderStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>Order Received</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>In Kitchen • Cooking</span>
          </span>
        );
      case 'on_the_way':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Bike className="w-3.5 h-3.5 text-purple-400" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'delivered':
      case 'completed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered & Enjoyed</span>
          </span>
        );
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'active') {
      return o.status === 'received' || o.status === 'preparing' || o.status === 'on_the_way';
    }
    if (statusFilter === 'completed') {
      return o.status === 'delivered' || o.status === 'completed' || !o.status;
    }
    return true;
  });

  // Calculate stats
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  // If user is not logged in:
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
          <Clock className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl font-bold font-serif text-white">Your Order History</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Sign in to your customer account to view your past orders, track live food preparation, download tax receipts, and re-order your favorite grilled specialties with a single click.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onRequireAuth}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="order-history-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Profile & Summary Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-extrabold text-lg shadow-md shrink-0">
            {currentUser.first_name[0]}
            {currentUser.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-white">
                {currentUser.first_name} {currentUser.last_name}'s Order History
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Phone: {currentUser.phone} • CNIC: {currentUser.cnic}
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end text-xs">
          <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 text-center min-w-[110px]">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block">Orders</span>
            <span className="text-lg font-bold text-white font-serif">{orders.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 text-center min-w-[120px]">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block">Total Spent</span>
            <span className="text-lg font-bold text-amber-400 font-serif">
              Rs. {totalSpent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Back to Menu Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Active / Cooking (
            {
              orders.filter(
                (o) => o.status === 'received' || o.status === 'preparing' || o.status === 'on_the_way'
              ).length
            }
            )
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'completed'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Delivered Past Orders
          </button>
        </div>

        <button
          onClick={onBrowseMenu}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>Explore Fresh Menu</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-xs">Loading your order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900/60 border border-stone-800 text-center space-y-4">
          <PackageCheck className="w-12 h-12 mx-auto text-stone-600 stroke-[1.5]" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-200">No orders found in this view</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {statusFilter === 'all'
                ? "You haven't placed any orders yet. Discover our grilled charcoal meats and handis!"
                : 'No orders match the selected filter category.'}
            </p>
          </div>
          <button
            onClick={onBrowseMenu}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Restaurant Menu</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg overflow-hidden transition-all hover:border-stone-700/80"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 bg-stone-950/60 border-b border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">
                      Receipt #INV-{order.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.order_type === 'delivery'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {order.order_type === 'delivery' ? (
                        <>
                          <Bike className="w-3 h-3" />
                          <span>Home Delivery</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3 h-3" />
                          <span>Takeaway Pickup</span>
                        </>
                      )}
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      <span>{order.created_at}</span>
                    </span>
                    {order.delivery_address && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                        <span className="truncate">{order.delivery_address}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Actions: Re-order entire meal or view receipt */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700/60"
                    title="View printable tax receipt"
                  >
                    <Receipt className="w-3.5 h-3.5 text-stone-400" />
                    <span>Receipt</span>
                  </button>

                  <button
                    onClick={() => handleReOrderEntireOrder(order)}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-950" />
                    <span>Re-Order Entire Meal</span>
                  </button>
                </div>
              </div>

              {/* Items List Inside Order */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="divide-y divide-stone-800/80">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-stone-800 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold text-stone-100 text-sm">{item.title}</span>
                          <span className="text-stone-400 text-xs">
                            (Rs. {item.price.toLocaleString()} ea)
                          </span>
                        </div>

                        {/* Add-ons badges */}
                        {item.add_ons && item.add_ons.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-7">
                            {item.add_ons.map((addon, aIdx) => (
                              <span
                                key={aIdx}
                                className="text-[10px] px-2 py-0.5 rounded bg-stone-800/90 text-stone-300 border border-stone-700/50"
                              >
                                + {addon.name} (Rs. {addon.price})
                              </span>
                            ))}
                          </div>
                        )}

                        {item.special_instructions && (
                          <p className="text-[10px] italic text-stone-400 pl-7">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>

                      {/* Right: Item Total & Single-Dish Re-order Button */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-200">
                          Rs.{' '}
                          {(
                            (item.price +
                              (item.add_ons || []).reduce((s, a) => s + (a.price || 0), 0)) *
                            item.quantity
                          ).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleReOrderSingleItem(item, order.id)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 text-xs transition-colors flex items-center gap-1"
                          title={`Re-order ${item.title}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px] font-semibold">Re-order</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary Strip */}
                <div className="pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>Subtotal: Rs. {order.subtotal.toLocaleString()}</span>
                    <span>•</span>
                    <span>GST (5%): Rs. {order.tax.toLocaleString()}</span>
                    {order.delivery_fee > 0 && (
                      <>
                        <span>•</span>
                        <span>Delivery: Rs. {order.delivery_fee.toLocaleString()}</span>
                      </>
                    )}
                    {order.tip > 0 && (
                      <>
                        <span>•</span>
                        <span>Tip: Rs. {order.tip.toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-stone-400 text-xs">Total Billed:</span>
                    <span className="text-base font-extrabold text-amber-400 font-serif">
                      Rs. {order.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase font-semibold">
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
