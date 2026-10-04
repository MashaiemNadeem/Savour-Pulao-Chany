import React from 'react';
import { motion } from 'motion/react';
import {
  Soup,
  Flame,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  UtensilsCrossed,
  MapPin,
  Heart,
  Plus,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Product, StoreSettings } from '../types.ts';

interface LandingPageProps {
  products: Product[];
  settings: StoreSettings;
  onOpenDishCustomizer: (product: Product) => void;
  onNavigateMenu: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  products,
  settings,
  onOpenDishCustomizer,
  onNavigateMenu,
  onOpenCart,
  cartCount,
}) => {
  const isShopOpen = Boolean(settings?.is_open ?? true);
  // Find top signature products
  const signaturePulao = products.find((p) => p.id === 1) || products[0];
  const featuredProducts = products.slice(0, 6);

  return (
    <div id="savour-landing-page" className="min-h-screen bg-[#0b0d12] text-stone-100 overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-amber-900/30 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/15 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headline, Description & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Live Kitchen Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 border border-amber-500/30 shadow-lg shadow-amber-950/40">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isShopOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isShopOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span className="text-amber-300 font-medium">
                {isShopOpen ? 'Kitchen Open Now' : 'Currently Offline'}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-300">25–35 Min Express Delivery</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <span className="block text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase">
                The Iconic Taste of Pakistan • Since 1988
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-serif tracking-tight text-white leading-[1.12]">
                Savour Pulao <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">&amp; Chany</span>
              </h1>
            </div>

            {/* Appetite description */}
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Fragrant aged Sella Basmati rice cooked in slow-boiled chicken yakhni broth, served with a crispy-tender golden roast chicken piece, hand-crafted spiced beef Shami Kabab, peppery Lahori Chany, and chilled zeera raita.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                id="hero-order-now-btn"
                onClick={onNavigateMenu}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span>Order Savour Pulao Online</span>
                <ArrowRight className="w-4 h-4 text-stone-950 stroke-[2.5]" />
              </button>

              <button
                id="hero-view-menu-btn"
                onClick={onNavigateMenu}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/80 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span>Explore Full Menu</span>
              </button>

              {cartCount > 0 && (
                <button
                  onClick={onOpenCart}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cart ({cartCount})</span>
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-6 border-t border-stone-800/80 text-left">
              <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="text-amber-400 font-extrabold text-base sm:text-xl font-serif">100%</div>
                <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium leading-tight mt-0.5">Aged Basmati Yakhni Rice</div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="text-emerald-400 font-extrabold text-base sm:text-xl font-serif">Fresh</div>
                <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium leading-tight mt-0.5">Daily Lahori Desi Chany</div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="text-amber-400 font-extrabold text-base sm:text-xl font-serif">38+ Yrs</div>
                <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium leading-tight mt-0.5">Culinary Heritage</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Hero Visual Platter Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 relative mt-4 lg:mt-0"
          >
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/30 bg-stone-900 shadow-2xl shadow-amber-950/50 group">
              <img
                src={signaturePulao?.image_url || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'}
                alt="Savour Special Chicken Pulao Platter"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              {/* Floating badges on image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-stone-950 shadow-md">
                  ★ Pakistan's #1 Pulao
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-md shadow-md">
                  100% Halal Chicken
                </span>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 space-y-3">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
                      Savour Special Chicken Pulao
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5 line-clamp-1">
                      Chicken Piece + Shami Kabab + Chany + Raita + Salad
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] sm:text-xs text-amber-300 block">Single Platter</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-serif">Rs. 490</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {signaturePulao && (
                    <button
                      id="hero-quick-customize-btn"
                      onClick={() => onOpenDishCustomizer(signaturePulao)}
                      className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md truncate"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                      <span className="truncate">Order Single Platter (Rs. 490)</span>
                    </button>
                  )}
                  <button
                    onClick={onNavigateMenu}
                    className="py-2.5 px-3 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 text-xs font-semibold shrink-0"
                    title="View other variations"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Little floating feature card */}
            <div className="hidden sm:flex absolute -bottom-5 left-4 lg:-left-5 items-center gap-3 p-3 rounded-2xl bg-[#121622]/95 border border-amber-500/30 shadow-xl backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left pr-1">
                <div className="text-xs font-bold text-stone-100">Secret 18-Spice Blend</div>
                <div className="text-[10px] text-stone-400">Authentic yakhni cooked fresh daily</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE 4 PILLARS OF SAVOUR EXCELLENCE */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            The Savour Standard
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            What Makes Savour Pulao &amp; Chany Unmatched
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Four iconic elements come together on every plate to create the taste loved by generations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/90 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Soup className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-300 transition-colors">
              Fragrant Basmati Pulao
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Carefully aged extra-long grain Sella Basmati rice gently simmered in a rich broth of chicken, whole cloves, black cardamom, and cumin.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/90 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-300 transition-colors">
              Golden Roast Chicken
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Marinated in house spice blend, steam-cooked to retain extreme tenderness, then flash-roasted to golden crisp skin perfection.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/90 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-100 group-hover:text-emerald-300 transition-colors">
              Crispy Beef Shami Kabab
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Finely pounded prime beef mince blended with split chana dal, fresh green herbs, dipped in egg wash, and pan-fried golden.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/90 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-300 transition-colors">
              Peppery Lahori Chany
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Velvety chickpeas stewed overnight in fragrant spiced gravy, infused with black pepper and pure desi ghee aroma.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE DISHES & BESTSELLERS */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0e1017] via-[#11141c] to-[#0c0d12] border-y border-amber-900/20">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Customer Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
                Signature Savour Menu Highlights
              </h2>
              <p className="text-xs sm:text-sm text-stone-400">
                Freshly prepared, packaged in thermal containers, and delivered piping hot.
              </p>
            </div>

            <button
              onClick={onNavigateMenu}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>View All Dishes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 overflow-hidden flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-amber-950/20"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-stone-950">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold bg-stone-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                      Rs. {product.price.toFixed(0)}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-300 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => onOpenDishCustomizer(product)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Customize &amp; Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE SAVOUR TRADITION / STORY SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-center lg:text-left">
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              The Heritage Behind The Flavor
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-white leading-tight">
              A Taste That Defined A Nation's Food Culture
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              What started as a passionate dream in the twin cities of Rawalpindi and Islamabad quickly blossomed into an authentic national culinary sensation. Savour Pulao &amp; Chany is more than just dinner—it's the student celebration meal, the family weekend gathering, and the first stop for visitors exploring Pakistan.
            </p>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              We never cut corners on quality: our rice is sourced directly from Punjab's finest paddy fields, our spices are ground in small daily batches, and our chicken is fresh, hygienic, and 100% Halal certified.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Artificial Preservatives</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Piping-Hot Thermal Foil Packaging</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free Raita &amp; Kachumber Salad</span>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-stone-900 p-2 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
              alt="Savour Traditional Feast Platter"
              className="w-full h-80 sm:h-96 object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent rounded-2xl m-2" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-stone-900/90 border border-stone-700/80 backdrop-blur-md">
              <p className="text-xs italic text-stone-300">
                "The hallmark of true Savour Pulao is that every single basmati grain stands separate, glistening with fragrant broth, while remaining incredibly soft and flavorful."
              </p>
              <div className="mt-2 text-[11px] font-bold text-amber-400">
                — Master Chef Ustad Rasheed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER REVIEWS TICKER */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0c10] border-t border-stone-800">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-2xl font-bold font-serif text-white">
              Loved by Foodies Across Pakistan
            </h2>
            <p className="text-xs text-stone-400">
              Over 250,000+ satisfied plates served this year alone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800/80 space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                "Nothing beats coming back to Islamabad and heading straight for Savour Pulao &amp; Chany. The roast chicken has that crispy skin and the Shami kabab is tender bliss. Absolute perfection!"
              </p>
              <div className="text-[11px]">
                <strong className="text-white block">Daniyal Raza</strong>
                <span className="text-stone-400">Blue Area Islamabad Regular</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800/80 space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                "The Lahori Chany in pure desi ghee combined with the fragrant pulao is heaven on a plate. The online ordering was lightning fast and arrived steaming hot in Lahore!"
              </p>
              <div className="text-[11px]">
                <strong className="text-white block">Zahra Mansoor</strong>
                <span className="text-stone-400">Shadman, Lahore</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800/80 space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                "The Family Feast Box saved our Sunday get-together! Huge portions, plenty of chicken pieces and shami kababs, and the matka kheer was the sweetest ending. Highly recommended."
              </p>
              <div className="text-[11px]">
                <strong className="text-white block">Majid Qureshi</strong>
                <span className="text-stone-400">Rawalpindi Saddar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION STRIP */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-8 sm:p-12 text-stone-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-950/40">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-950">
              Craving The Original Savour Pulao?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
              Order Online Now &amp; Enjoy 15% Off Your First Order!
            </h2>
            <p className="text-xs sm:text-sm font-medium text-amber-950/80 max-w-xl">
              Use code <strong className="font-extrabold text-stone-950 underline">SAVOUR15</strong> during checkout for instant savings.
            </p>
          </div>

          <button
            onClick={onNavigateMenu}
            className="px-8 py-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open Menu &amp; Order Now</span>
          </button>
        </div>
      </section>
    </div>
  );
};
