import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, Phone, Sparkles, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface ShopStatusSplashProps {
  isOpen: boolean;
  settings: StoreSettings;
  onDismiss: () => void;
  onOpenAdmin: () => void;
}

export const ShopStatusSplash: React.FC<ShopStatusSplashProps> = ({
  isOpen,
  settings,
  onDismiss,
  onOpenAdmin,
}) => {
  const s: StoreSettings = settings || {
    is_open: isOpen ?? true,
    opening_hours: '11:00 AM – 01:30 AM Daily',
    announcement: 'Welcome to Savour Pulao & Chany! Savor our world-famous fragrant Basmati chicken pulao with crispy shami kababs, special Lahori chany, and fresh mint raita.',
    phone: '+92 51 2801122',
    address: 'Jinnah Avenue Blue Area Islamabad • Gordon College Road Rawalpindi • Shadman Lahore',
    flat_delivery_fee: 120,
    tax_rate: 0.05,
  };

  const storeIsOpen = typeof s.is_open === 'boolean' ? s.is_open : isOpen;

  return (
    <AnimatePresence>
      <motion.div
        id="shop-status-splash-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-stone-800 bg-[#161922] p-6 shadow-2xl text-stone-100 sm:p-8"
        >
          {/* Subtle glow backdrop */}
          <div
            className={`absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
              storeIsOpen ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <div
            className={`absolute -left-20 -bottom-20 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
              storeIsOpen ? 'bg-amber-500' : 'bg-rose-600'
            }`}
          />

          {/* Header Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                Live Store Telemetry
              </span>
            </div>
            <button
              id="splash-admin-shortcut-btn"
              onClick={onOpenAdmin}
              className="text-xs flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors px-2.5 py-1 rounded-md bg-stone-800/60 border border-stone-700/60"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Admin Control
            </button>
          </div>

          {/* Main Status Display */}
          <div className="mt-6 text-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="mx-auto inline-flex items-center justify-center p-4 rounded-2xl bg-stone-900/90 border border-stone-700/50 shadow-inner mb-4"
            >
              {storeIsOpen ? (
                <div className="flex items-center gap-3 px-3 py-1">
                  <span className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-emerald-400">
                    RESTAURANT IS OPEN
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-1">
                  <XCircle className="w-8 h-8 text-rose-500" />
                  <span className="text-2xl font-bold tracking-tight text-rose-400">
                    CURRENTLY CLOSED
                  </span>
                </div>
              )}
            </motion.div>

            <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif sm:text-3xl">
              Savour Pulao &amp; Chany
            </h2>
            <p className="mt-2 text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
              {s.announcement ||
                'Welcome to Savour Pulao & Chany! Savor our world-famous fragrant Basmati chicken pulao with crispy shami kababs, special Lahori chany, and fresh mint raita.'}
            </p>
          </div>

          {/* Operating Information Card */}
          <div className="mt-6 space-y-2.5 rounded-xl bg-stone-900/80 p-4 border border-stone-800">
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Operating Hours:{' '}
                <strong className="text-stone-100 font-semibold">{s.opening_hours}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{s.address}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{s.phone}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              id="splash-dismiss-btn"
              onClick={onDismiss}
              className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                storeIsOpen
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:brightness-110'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
              }`}
            >
              {storeIsOpen ? 'Enter Menu & Order Online' : 'Browse Menu (Pre-Orders Only)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-stone-400">
            {storeIsOpen
              ? '✨ Kitchen is actively accepting Delivery, Pickup, and In-Store orders.'
              : '⚠️ Kitchen is currently offline. You can still inspect dishes and prepare your cart.'}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
