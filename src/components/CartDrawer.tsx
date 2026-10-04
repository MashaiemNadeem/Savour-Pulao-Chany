import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Compass,
  ShoppingBag,
  Bike,
  Store,
  DollarSign,
  ArrowRight,
  Sparkles,
  CreditCard,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { CartItem, OrderType, User, StoreSettings } from '../types.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  currentUser: User | null;
  onRequireAuth: () => void;
  settings: StoreSettings;
  onOrderSuccess: (orderData: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onRequireAuth,
  settings,
  onOrderSuccess,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmarks, setLandmarks] = useState('');
  const [coordinates, setCoordinates] = useState<string>('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Tip selection
  const [tipSelection, setTipSelection] = useState<'none' | '5%' | '10%' | '15%' | 'custom'>('5%');
  const [customTip, setCustomTip] = useState<number>(100);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'online'>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const addOnsPrice = item.add_ons.reduce((aSum, a) => aSum + a.price, 0);
      return sum + (item.price + addOnsPrice) * item.quantity;
    }, 0);
  }, [items]);

  // Tax calculation (5%)
  const tax = useMemo(() => {
    const rate = typeof settings?.tax_rate === 'number' ? settings.tax_rate : 0.05;
    return Math.round(subtotal * rate * 100) / 100;
  }, [subtotal, settings?.tax_rate]);

  // Delivery fee (0 if pickup, otherwise flat base fee)
  const deliveryFee = useMemo(() => {
    if (orderType === 'pickup') return 0;
    return typeof settings?.flat_delivery_fee === 'number' ? settings.flat_delivery_fee : 150;
  }, [orderType, settings?.flat_delivery_fee]);

  // Tip amount
  const tipAmount = useMemo(() => {
    if (tipSelection === '5%') return Math.round(subtotal * 0.05);
    if (tipSelection === '10%') return Math.round(subtotal * 0.1);
    if (tipSelection === '15%') return Math.round(subtotal * 0.15);
    if (tipSelection === 'custom') return Math.max(0, customTip || 0);
    return 0;
  }, [tipSelection, subtotal, customTip]);

  // Total
  const grandTotal = useMemo(() => {
    return subtotal + tax + deliveryFee + tipAmount;
  }, [subtotal, tax, deliveryFee, tipAmount]);

  // Browser Geolocation API Handler
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationStatus('Locating device GPS satellites...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lon = pos.coords.longitude.toFixed(5);
        const coordsStr = `${lat}, ${lon}`;
        setCoordinates(coordsStr);

        try {
          // Attempt client-side reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          if (res.ok) {
            const data = await res.json();
            const resolvedAddress = data.display_name || `Near GPS: ${coordsStr}`;
            setDeliveryAddress(resolvedAddress);
            setLocationStatus(`Verified coordinates: ${coordsStr}`);
          } else {
            setDeliveryAddress(`Pin Location: (${coordsStr})`);
            setLocationStatus(`Acquired GPS Coordinates: ${coordsStr}`);
          }
        } catch {
          setDeliveryAddress(`Pinpoint Coordinates: [${coordsStr}]`);
          setLocationStatus(`Location acquired: ${coordsStr}`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (err) => {
        setIsFetchingLocation(false);
        if (err.code === 1) {
          setLocationStatus('Location permission denied. Please enter address manually.');
        } else {
          setLocationStatus('Could not retrieve location. Please input address manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Online Order
  const handleCheckout = async () => {
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Please specify a delivery address or click "Fetch My Current Location".');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = landmarks
        ? `${deliveryAddress} (Landmark: ${landmarks})`
        : deliveryAddress;

      const orderPayload = {
        user_id: currentUser.id,
        order_type: orderType,
        customer_name: `${currentUser.first_name} ${currentUser.last_name}`,
        customer_phone: currentUser.phone,
        delivery_address: orderType === 'delivery' ? fullAddress : 'Customer In-Store Pickup',
        lat_long: coordinates,
        items,
        subtotal,
        tax,
        tip: tipAmount,
        delivery_fee: deliveryFee,
        total: grandTotal,
        payment_method: paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      onClearCart();
      onClose();
      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-screen max-w-md bg-[#161822] border-l border-stone-800 text-stone-100 flex flex-col shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-white">Your Order Basket</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-800 text-amber-400">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {items.length === 0 ? (
                <div className="py-16 text-center text-stone-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-stone-600 mb-3 stroke-[1.5]" />
                  <p className="font-medium text-stone-300">Your basket is currently empty</p>
                  <p className="text-xs text-stone-400 mt-1">Explore our grilled delights to add dishes.</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const itemAddOnsTotal = item.add_ons.reduce((sum, a) => sum + a.price, 0);
                      const unitTotal = item.price + itemAddOnsTotal;

                      return (
                        <div
                          key={item.cart_item_id}
                          className="p-3 rounded-xl bg-stone-900/90 border border-stone-800/80 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-semibold text-xs text-stone-100">{item.title}</h5>
                              <p className="text-[11px] text-amber-400 font-medium">
                                Rs. {unitTotal.toLocaleString()} each
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.cart_item_id)}
                              className="text-stone-400 hover:text-rose-400 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Add-ons list if any */}
                          {item.add_ons.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.add_ons.map((addon) => (
                                <span
                                  key={addon.id}
                                  className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700/60"
                                >
                                  + {addon.name} (Rs. {addon.price})
                                </span>
                              ))}
                            </div>
                          )}

                          {item.special_instructions && (
                            <p className="text-[10px] italic text-stone-400">
                              Note: {item.special_instructions}
                            </p>
                          )}

                          {/* Quantity control */}
                          <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-xs">
                            <span className="text-[11px] text-stone-400">Quantity</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onUpdateQuantity(item.cart_item_id, -1)}
                                className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-white w-5 text-center">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.cart_item_id, 1)}
                                className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-stone-100 ml-2">
                                Rs. {(unitTotal * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Type Toggle: Delivery or Pickup */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-stone-300 mb-2">
                      Fulfillment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          orderType === 'delivery'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Bike className="w-4 h-4" />
                        <span>Doorstep Delivery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          orderType === 'pickup'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Takeaway Pickup</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Location Section */}
                  {orderType === 'delivery' ? (
                    <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          Delivery Destination
                        </label>
                        <button
                          type="button"
                          onClick={handleFetchCurrentLocation}
                          disabled={isFetchingLocation}
                          className="text-[11px] flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 transition-all disabled:opacity-50"
                        >
                          <Compass className={`w-3.5 h-3.5 ${isFetchingLocation ? 'animate-spin' : ''}`} />
                          <span>{isFetchingLocation ? 'Locating...' : 'Fetch My Location'}</span>
                        </button>
                      </div>

                      {locationStatus && (
                        <p className="text-[10px] text-amber-300/80 bg-amber-500/10 p-1.5 rounded">
                          {locationStatus}
                        </p>
                      )}

                      <textarea
                        rows={2}
                        required
                        placeholder="House / Flat / Street address, Phase, Area..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                      />

                      <input
                        type="text"
                        placeholder="Nearby landmark or gate instruction (optional)"
                        value={landmarks}
                        onChange={(e) => setLandmarks(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Store className="w-4 h-4" />
                        <span>Pickup Counter Instructions</span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Collect directly from {settings.address}. Prepared hot in approx. 20–25 minutes. No delivery fee charged.
                      </p>
                    </div>
                  )}

                  {/* Interactive Tip Option */}
                  <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                      <span>Rider / Kitchen Tip</span>
                      <span className="text-amber-400">Rs. {tipAmount}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-xs font-medium">
                      {(['none', '5%', '10%', '15%', 'custom'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipSelection(t)}
                          className={`py-1.5 rounded-lg border text-center transition-all ${
                            tipSelection === t
                              ? 'bg-amber-500 text-stone-950 font-bold border-amber-500'
                              : 'bg-stone-950 border-stone-800 text-stone-300 hover:text-white'
                          }`}
                        >
                          {t === 'none' ? 'None' : t}
                        </button>
                      ))}
                    </div>

                    {tipSelection === 'custom' && (
                      <div className="pt-1">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="Enter custom tip (Rs.)"
                          value={customTip}
                          onChange={(e) => setCustomTip(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash_on_delivery')}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === 'cash_on_delivery'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Cash On {orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online')}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === 'online'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Online / Card</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-900/95 space-y-3">
                <div className="space-y-1.5 text-xs text-stone-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-stone-200 font-medium">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST / Sales Tax (5%)</span>
                    <span className="text-stone-200 font-medium">Rs. {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className="text-stone-200 font-medium">
                      {orderType === 'pickup' ? (
                        <span className="text-emerald-400">FREE</span>
                      ) : (
                        `Rs. ${deliveryFee.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Kitchen Tip</span>
                      <span className="text-stone-200 font-medium">Rs. {tipAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone-800 text-sm font-bold text-white">
                    <span>Grand Total</span>
                    <span className="text-amber-400 text-base">Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer Identity Requirement Notice */}
                {!currentUser ? (
                  <button
                    onClick={onRequireAuth}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Sign Up / Login to Place Order</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Dispatching Order...' : 'Confirm & Place Order'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
