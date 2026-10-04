import React, { useState } from 'react';
import {
  Soup,
  Phone,
  MapPin,
  Clock,
  Mail,
  ShieldCheck,
  Heart,
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface FooterProps {
  settings: StoreSettings;
  onNavigateMenu: () => void;
  onNavigateHome: () => void;
  onNavigatePos: () => void;
  onNavigateAdmin: () => void;
  onOpenCart: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onNavigateMenu,
  onNavigateHome,
  onNavigatePos,
  onNavigateAdmin,
  onOpenCart,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer id="main-app-footer" className="bg-[#090b10] border-t border-amber-900/30 text-stone-300 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-96 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Newsletter Bar */}
      <div className="border-b border-stone-800/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Exclusive Deals & Family Offers
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-amber-50">
              Get 15% off your next Savour Pulao &amp; Chany order
            </h3>
            <p className="text-xs text-stone-400">
              Subscribe to get secret discount codes, weekend family deal announcements, and holiday specials.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="footer-email-input"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address"
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700/80 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <button
              id="footer-subscribe-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {subscribed && (
          <div className="max-w-7xl mx-auto mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Thank you for subscribing! Check your inbox for your 15% welcome promo code: <strong>SAVOUR15</strong>.</span>
          </div>
        )}
      </div>

      {/* Main Footer Links & Info Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/30 text-stone-950">
              <Soup className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-serif font-extrabold text-xl tracking-tight text-white block leading-none">
                SAVOUR PULAO &amp; CHANY
              </span>
              <span className="text-[11px] tracking-widest text-amber-400 font-semibold uppercase block mt-1">
                The Iconic Taste of Pakistan • Est. 1988
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
            Known nationwide for our legendary golden Basmati Pulao simmered in rich chicken yakhni broth, golden roast chicken, crispy hand-crafted Shami Kabab, and peppery Lahori Chany.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Halal Certified
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Pure Desi Ghee Recipe
            </span>
          </div>

          <div className="pt-2">
            <p className="text-xs text-stone-400">
              Need assistance or party order booking?{' '}
              <a href="tel:+92512801122" className="text-amber-400 font-bold hover:underline">
                +92 51 2801122
              </a>
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Explore &amp; Order
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={onNavigateHome}
                className="text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>Landing Page</span>
              </button>
            </li>
            <li>
              <button
                onClick={onNavigateMenu}
                className="text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>Full Food Menu</span>
              </button>
            </li>
            <li>
              <button
                onClick={onOpenCart}
                className="text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>View Order Cart</span>
              </button>
            </li>
            <li>
              <button
                onClick={onNavigateMenu}
                className="text-stone-300 hover:text-amber-400 transition-colors"
              >
                <span>Family Feast Deals</span>
              </button>
            </li>
            <li>
              <button
                onClick={onNavigateMenu}
                className="text-stone-300 hover:text-amber-400 transition-colors"
              >
                <span>Lahori Chany Specials</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Our Popular Branches */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Iconic Branches
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-200 block">Islamabad (HQ)</strong>
                <span>Jinnah Avenue, Blue Area</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-200 block">Rawalpindi</strong>
                <span>Gordon College Road, Saddar</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-200 block">Lahore</strong>
                <span>Shadman Market &amp; DHA Phase 5</span>
              </div>
            </li>
          </ul>
        </div>

        {/* System & Operations */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Restaurant Operations
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>11:00 AM – 01:30 AM Daily</span>
            </li>
            <li>
              <button
                onClick={onNavigatePos}
                className="text-stone-400 hover:text-amber-400 transition-colors block text-left"
              >
                Cashier POS Terminal
              </button>
            </li>
            <li>
              <button
                onClick={onNavigateAdmin}
                className="text-stone-400 hover:text-amber-400 transition-colors block text-left"
              >
                Admin Management Center
              </button>
            </li>
            <li className="pt-2 text-[11px] text-stone-500">
              Accepting Cash on Delivery, JazzCash, EasyPaisa, &amp; Credit Cards.
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Credits */}
      <div className="border-t border-stone-800/60 py-5 px-4 sm:px-6 lg:px-8 bg-[#06080b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()}</span>
            <strong className="text-stone-300 font-medium">Savour Pulao &amp; Chany</strong>.
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hover:text-stone-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-stone-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-stone-400 cursor-pointer">Food Hygiene Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
