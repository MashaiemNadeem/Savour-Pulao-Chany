import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2, Sparkles } from 'lucide-react';
import { Order } from '../types.ts';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm rounded-2xl border border-stone-800 bg-white text-stone-900 shadow-2xl p-6 print:p-0 print:border-none print:shadow-none print:w-full"
        >
          {/* Action buttons (hidden on print) */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 print:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Official Tax Receipt
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Thermal Receipt Content */}
          <div id="thermal-receipt-area" className="pt-4 font-mono text-xs space-y-3">
            <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-3">
              <h3 className="font-serif font-extrabold text-lg text-stone-950 uppercase tracking-tight">
                Savour Pulao &amp; Chany
              </h3>
              <p className="text-[11px] text-stone-600">Jinnah Ave Blue Area, Islamabad • Saddar Rawalpindi • Lahore</p>
              <p className="text-[10px] text-stone-500">Tel: +92 51 2801122 | NTN: 8492019-2</p>
              <div className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900">
                {order.order_type.toUpperCase()} ORDER
              </div>
            </div>

            {/* Metadata */}
            <div className="text-[11px] space-y-1 border-b border-dashed border-stone-300 pb-2 text-stone-700">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">INV-{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{order.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact:</span>
                <span>{order.customer_phone}</span>
              </div>
              {order.delivery_address && (
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="text-right truncate max-w-[170px]">{order.delivery_address}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-stone-500 pb-1">
                <span>Item</span>
                <span>Qty x Price</span>
                <span>Total</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-stone-900">{item.title}</span>
                    <span className="text-stone-600">
                      {item.quantity} x {item.price}
                    </span>
                    <span className="font-bold">Rs. {(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                  {item.add_ons && item.add_ons.length > 0 && (
                    <div className="pl-2 text-[10px] text-stone-500">
                      {item.add_ons.map((a, aIdx) => (
                        <div key={aIdx} className="flex justify-between">
                          <span>+ {a.name}</span>
                          <span>Rs. {a.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2 text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (5% GST):</span>
                <span>Rs. {order.tax.toLocaleString()}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>Rs. {order.delivery_fee.toLocaleString()}</span>
                </div>
              )}
              {order.tip > 0 && (
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>Rs. {order.tip.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-stone-400 font-extrabold text-sm text-stone-950">
                <span>TOTAL AMOUNT:</span>
                <span>Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Cash Tendered & Change (for POS In-Store orders) */}
            {order.order_type === 'pos' && order.cash_given !== undefined && (
              <div className="space-y-1 text-[11px] bg-stone-50 p-2 rounded border border-stone-200">
                <div className="flex justify-between font-bold text-stone-800">
                  <span>Cash Tendered:</span>
                  <span>Rs. {order.cash_given.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-700 text-xs">
                  <span>Change Returned:</span>
                  <span>Rs. {(order.change_returned || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="text-center pt-2 space-y-1 text-[10px] text-stone-500">
              <p>*** THANK YOU FOR DINING WITH US ***</p>
              <p>Please retain receipt for feedback & reward loyalty points.</p>
              <p className="text-[9px] text-stone-400">Powered by Savour Pulao &amp; Chany POS Engine</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 flex justify-end print:hidden">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
