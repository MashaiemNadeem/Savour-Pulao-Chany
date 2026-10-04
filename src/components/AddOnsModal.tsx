import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check, Flame, MessageSquare } from 'lucide-react';
import { Product, CartItemAddOn } from '../types.ts';

interface AddOnsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedAddOns: CartItemAddOn[],
    specialInstructions: string
  ) => void;
}

export const AddOnsModal: React.FC<AddOnsModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<CartItemAddOn[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const toggleAddOn = (addOn: CartItemAddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addOn.id);
      if (exists) {
        return prev.filter((a) => a.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const totalItemPrice = (product.price + addOnsTotal) * quantity;

  const handleConfirm = () => {
    onAddToCart(product, quantity, selectedAddOns, specialInstructions);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-[#161822] shadow-2xl text-stone-100 overflow-hidden my-4"
        >
          {/* Header image banner */}
          <div className="relative h-44 w-full overflow-hidden bg-stone-900">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover brightness-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161822] via-[#161822]/40 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-stone-300 hover:text-white backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-5 right-5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Customize Order
              </span>
              <h3 className="text-xl font-bold font-serif text-white">{product.title}</h3>
              <p className="text-amber-400 font-bold text-sm">Rs. {product.price.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Description */}
            <p className="text-xs text-stone-300 leading-relaxed">{product.description}</p>

            {/* Extras & Add-Ons list */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-300">
                  Select Add-Ons & Extras
                </h4>
                <span className="text-[11px] text-amber-400">Optional</span>
              </div>

              <div className="space-y-2">
                {(product.available_add_ons || []).map((addon) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-stone-950'
                              : 'border-stone-700 bg-stone-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-stone-200">{addon.name}</span>
                      </div>
                      <span className="font-semibold text-amber-400">+ Rs. {addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions textarea */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                Special Cooking Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Mild spice, extra crispy naan, serve lime wedges..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/90 border border-stone-800">
              <span className="text-xs font-semibold text-stone-300">Portions / Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 bg-stone-900/95 border-t border-stone-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-stone-400">Total Price</p>
              <p className="text-lg font-extrabold text-amber-400">
                Rs. {totalItemPrice.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Add to Cart</span>
              <span>• Rs. {totalItemPrice.toLocaleString()}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
