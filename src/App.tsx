import React, { useState, useEffect } from 'react';
import {
  Flame,
  Soup,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Monitor,
  ShieldCheck,
  UtensilsCrossed,
  Store,
  Clock,
  Sparkles,
  PhoneCall,
  MapPin,
  Menu,
  X,
  History,
} from 'lucide-react';
import {
  Product,
  Category,
  CartItem,
  CartItemAddOn,
  User,
  StoreSettings,
  Order,
} from './types.ts';
import { ShopStatusSplash } from './components/ShopStatusSplash.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { CustomerPortal } from './components/CustomerPortal.tsx';
import { PosTerminal } from './components/PosTerminal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AddOnsModal } from './components/AddOnsModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { Footer } from './components/Footer.tsx';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
} from './initialData.ts';

export default function App() {
  // Global Store Settings & Splash
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // App Navigation View: 'customer' | 'pos' | 'admin'
  const [viewMode, setViewMode] = useState<'customer' | 'pos' | 'admin'>('customer');
  const [customerTab, setCustomerTab] = useState<'home' | 'menu' | 'history'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Catalog Data initialized with rich fallback data so it never flashes empty or crashes
  const [products, setProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // User Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('savour_current_user');

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login' | 'staff'>('register');

  // Cart State (Customer Online Portal)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add-Ons Customization Modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Receipt Modal (Triggered on completed orders)
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  const isStoreOpen = Boolean(settings?.is_open ?? true);

  // Fetch Store Status and Products/Categories safely
  const loadStoreData = async () => {
    try {
      const [resStatus, resProducts, resCategories, resUser] = await Promise.allSettled([
        fetch('/api/store-status'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/auth/me'),
      ]);

      if (resStatus.status === 'fulfilled' && resStatus.value.ok) {
        const ct = resStatus.value.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const sData = await resStatus.value.json().catch(() => null);
          const loaded = sData?.settings || sData?.data;
          if (loaded && typeof loaded === 'object') {
            setSettings((prev) => ({ ...prev, ...loaded }));
          }
        }
      }

      if (resProducts.status === 'fulfilled' && resProducts.value.ok) {
        const ct = resProducts.value.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const pData = await resProducts.value.json().catch(() => null);
          if (Array.isArray(pData?.products) && pData.products.length > 0) {
            setProducts(pData.products);
          }
          if (Array.isArray(pData?.categories) && pData.categories.length > 0) {
            setCategories(pData.categories);
          }
        }
      }

      if (resCategories.status === 'fulfilled' && resCategories.value.ok) {
        const ct = resCategories.value.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const cData = await resCategories.value.json().catch(() => null);
          if (Array.isArray(cData?.categories) && cData.categories.length > 0) {
            setCategories(cData.categories);
          }
        }
      }

      if (resUser.status === 'fulfilled' && resUser.value.ok) {
        const ct = resUser.value.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const uData = await resUser.value.json().catch(() => null);
          if (uData?.authenticated && uData?.user) {
            setCurrentUser(uData.user);
          }
        }
      }
    } catch (err) {
      console.warn('Initial store sync note:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Cart Handlers
  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedAddOns: CartItemAddOn[],
    specialInstructions: string
  ) => {
    const cartItemId = `${product.id}_${Date.now()}`;
    const newItem: CartItem = {
      cart_item_id: cartItemId,
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      add_ons: selectedAddOns,
      special_instructions: specialInstructions,
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
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

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleReOrderItems = (newItems: CartItem[]) => {
    setCartItems((prev) => [...prev, ...newItems]);
    setIsCartOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      if (viewMode === 'pos' || viewMode === 'admin') {
        setViewMode('customer');
      }
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0e1017] text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950 overflow-x-hidden">
      {/* 1. Dynamic Shop Open / Closed Splash Banner */}
      {showSplash && (
        <ShopStatusSplash
          isOpen={isStoreOpen}
          settings={settings}
          onDismiss={() => setShowSplash(false)}
          onOpenAdmin={() => {
            setShowSplash(false);
            if (currentUser?.role === 'admin') {
              setViewMode('admin');
            } else {
              setAuthModalMode('staff');
              setAuthModalOpen(true);
            }
          }}
        />
      )}

      {/* 2. Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#12141d]/95 backdrop-blur-md border-b border-stone-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('home');
                setShowSplash(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#0d0f15] rounded-[10px] flex items-center justify-center">
                  <Soup className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="font-serif font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white block leading-none truncate">
                  SAVOUR PULAO
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest text-amber-400 font-semibold uppercase block mt-0.5 truncate">
                  &amp; CHANY • 1988
                </span>
              </div>
            </button>

            {/* Live Store Status Indicator */}
            <button
              onClick={() => setShowSplash(true)}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors shrink-0 ${isStoreOpen
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              title="Click to view shop hours splash screen"
            >
              <span
                className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
              />
              <span>{isStoreOpen ? 'OPEN NOW' : 'CLOSED'}</span>
            </button>
          </div>

          {/* Central System Mode Switcher */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold shrink-0">
            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('home');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'customer' && customerTab === 'home'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('menu');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'customer' && customerTab === 'menu'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>

            <button
              id="header-order-history-btn"
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('history');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'customer' && customerTab === 'history'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Order History</span>
            </button>

            <button
              onClick={() => {
                if (currentUser && (currentUser.role === 'cashier' || currentUser.role === 'admin')) {
                  setViewMode('pos');
                } else {
                  setAuthModalMode('staff');
                  setAuthModalOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'pos'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Cashier POS</span>
            </button>

            <button
              onClick={() => {
                if (currentUser && currentUser.role === 'admin') {
                  setViewMode('admin');
                } else {
                  setAuthModalMode('staff');
                  setAuthModalOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Center</span>
            </button>
          </nav>

          {/* Right Action Icons: Cart & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Basket Button (Visible in Customer view) */}
            {viewMode === 'customer' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
                {totalCartCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-stone-950">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Button or User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-stone-100 leading-none">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-rose-400 border border-stone-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold text-stone-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:inline-flex py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white bg-stone-900 border border-stone-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-stone-950/98 backdrop-blur-md border-b border-stone-800 p-4 space-y-2 max-h-[85vh] overflow-y-auto">
            {/* Mobile Store Status Pill */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800/80">
              <span className="text-xs text-stone-400">Kitchen Status:</span>
              <button
                onClick={() => {
                  setShowSplash(true);
                  setMobileMenuOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${isStoreOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isStoreOpen ? 'OPEN NOW • 11 AM - 01:30 AM' : 'CURRENTLY CLOSED'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${viewMode === 'customer' && customerTab === 'home'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:bg-stone-900'
                }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Home (Landing Page)</span>
            </button>
            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('menu');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${viewMode === 'customer' && customerTab === 'menu'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:bg-stone-900'
                }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Online Food Menu</span>
            </button>
            <button
              onClick={() => {
                setViewMode('customer');
                setCustomerTab('history');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${viewMode === 'customer' && customerTab === 'history'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:bg-stone-900'
                }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>My Order History &amp; Re-Order</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentUser && (currentUser.role === 'cashier' || currentUser.role === 'admin')) {
                  setViewMode('pos');
                } else {
                  setAuthModalMode('staff');
                  setAuthModalOpen(true);
                }
              }}
              className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${viewMode === 'pos' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow' : 'text-stone-300 hover:bg-stone-900'
                }`}
            >
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>In-Store Cashier POS</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentUser && currentUser.role === 'admin') {
                  setViewMode('admin');
                } else {
                  setAuthModalMode('staff');
                  setAuthModalOpen(true);
                }
              }}
              className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${viewMode === 'admin' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow' : 'text-stone-300 hover:bg-stone-900'
                }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Management Dashboard</span>
            </button>

            {/* Mobile Auth options */}
            {!currentUser ? (
              <div className="pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-stone-900 text-stone-200 border border-stone-800 text-xs font-bold text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold text-center shadow"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-200">{currentUser.first_name} {currentUser.last_name}</p>
                  <p className="text-[10px] text-amber-400 uppercase font-semibold">{currentUser.role} account</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main View Router */}
      <main>
        {viewMode === 'customer' && customerTab === 'home' && (
          <LandingPage
            products={products}
            settings={settings}
            onOpenDishCustomizer={(p) => setCustomizingProduct(p)}
            onNavigateMenu={() => {
              setViewMode('customer');
              setCustomerTab('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
          />
        )}

        {viewMode === 'customer' && customerTab !== 'home' && (
          <CustomerPortal
            products={products}
            categories={categories}
            currentUser={currentUser}
            settings={settings}
            onOpenDishCustomizer={(p) => setCustomizingProduct(p)}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
            onRequireAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onReOrderItems={handleReOrderItems}
            activeCustomerTab={customerTab}
            onTabChange={setCustomerTab}
          />
        )}

        {viewMode === 'pos' && (
          <PosTerminal
            products={products}
            categories={categories}
            currentUser={currentUser}
            settings={settings}
            onOrderCompleted={() => loadStoreData()}
          />
        )}

        {viewMode === 'admin' && (
          <AdminDashboard
            products={products}
            categories={categories}
            settings={settings}
            currentUser={currentUser}
            onRefreshData={() => loadStoreData()}
            onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...(s || {}) }))}
          />
        )}
      </main>

      {/* Global Footer (For Customer Experience) */}
      {viewMode === 'customer' && (
        <Footer
          settings={settings}
          onNavigateHome={() => {
            setViewMode('customer');
            setCustomerTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateMenu={() => {
            setViewMode('customer');
            setCustomerTab('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigatePos={() => {
            if (currentUser && (currentUser.role === 'cashier' || currentUser.role === 'admin')) {
              setViewMode('pos');
            } else {
              setAuthModalMode('staff');
              setAuthModalOpen(true);
            }
          }}
          onNavigateAdmin={() => {
            if (currentUser && currentUser.role === 'admin') {
              setViewMode('admin');
            } else {
              setAuthModalMode('staff');
              setAuthModalOpen(true);
            }
          }}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* 3. Add-Ons & Extras Customization Modal */}
      <AddOnsModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 4. Cart & Dynamic Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onRequireAuth={() => {
          setAuthModalMode('register');
          setAuthModalOpen(true);
        }}
        settings={settings}
        onOrderSuccess={(order) => {
          setActiveReceiptOrder(order);
          loadStoreData();
        }}
      />

      {/* 5. User Registration & Staff Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);

          localStorage.setItem(
            'savour_current_user',
            JSON.stringify(user)
          );

          if (user.role === 'cashier') setViewMode('pos');
          if (user.role === 'admin') setViewMode('admin');
        }}
      />

      {/* 6. Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
      />
    </div>
  );
}
