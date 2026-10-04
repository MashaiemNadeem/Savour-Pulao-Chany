import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { User, UserRole } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'register' | 'staff';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'register',
}) => {
  const [tab, setTab] = useState<'register' | 'login' | 'staff'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');

  // Staff login state
  const [staffRole, setStaffRole] = useState<'cashier' | 'admin'>('cashier');
  const [staffIdentifier, setStaffIdentifier] = useState('cashier@savourpulao.com');
  const [staffPassword, setStaffPassword] = useState('Password123!');

  // Reset errors when switching tab
  const handleTabChange = (newTab: 'register' | 'login' | 'staff') => {
    setTab(newTab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // CNIC Auto-Formatter (e.g., 35201-1234567-1)
  const handleCnicChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 13);
    let formatted = raw;
    if (raw.length > 5 && raw.length <= 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    } else if (raw.length > 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12, 13)}`;
    }
    setCnic(formatted);
  };

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 25;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score += 25;
    if (passwordCriteria.hasNumber) score += 25;
    if (passwordCriteria.hasSpecial) score += 25;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (passwordScore === 0) return { label: 'Enter password', color: 'bg-stone-700', text: 'text-stone-400' };
    if (passwordScore <= 25) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (passwordScore <= 50) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (passwordScore <= 75) return { label: 'Good', color: 'bg-blue-400', text: 'text-blue-400' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [passwordScore]);

  // Handle Customer Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please enter both your first and last name.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 9) {
      setErrorMsg('Please enter a valid telephone/mobile number.');
      return;
    }
    const cleanCnic = cnic.replace(/[^0-9]/g, '');
    if (cleanCnic.length !== 13) {
      setErrorMsg('CNIC must be 13 digits (format: 35201-1234567-1).');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          cnic,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while creating account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Customer Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          password,
          role: 'customer',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Staff Login (Cashier / Admin)
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: staffIdentifier,
          password: staffPassword,
          role: staffRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Staff authentication failed.');
      }

      setSuccessMsg(`Welcome, ${data.user.first_name} (${data.user.role.toUpperCase()})!`);
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff login error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-[#161822] p-6 shadow-2xl text-stone-100 sm:p-8 my-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="text-center pb-2">
            <h3 className="text-2xl font-bold font-serif text-white">
              {tab === 'register' && 'Customer Registration'}
              {tab === 'login' && 'Customer Sign In'}
              {tab === 'staff' && 'Staff Terminal Access'}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              {tab === 'register' && 'Register your identity before placing online orders'}
              {tab === 'login' && 'Access saved addresses, history, and fast checkout'}
              {tab === 'staff' && 'Unified login for Cashiers (POS) & Store Administrators'}
            </p>
          </div>

          {/* Unified Mode Switcher */}
          <div className="flex rounded-xl bg-stone-900/90 p-1 mt-4 border border-stone-800 text-xs font-medium">
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange('staff')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'staff'
                  ? 'bg-stone-700 text-amber-300 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Staff Portal
            </button>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: REGISTRATION */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">First Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ayesha"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Khan"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Contact Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">CNIC Number *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      maxLength={15}
                      placeholder="35201-1234567-1"
                      value={cnic}
                      onChange={(e) => handleCnicChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Dynamic Strength Meter */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter Bar */}
                {password.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">Password Strength:</span>
                      <span className={`font-semibold ${strengthLabel.text}`}>
                        {strengthLabel.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthLabel.color}`}
                        style={{ width: `${passwordScore}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-stone-400">
                      <span className={passwordCriteria.length ? 'text-emerald-400' : ''}>
                        • 8+ characters
                      </span>
                      <span className={passwordCriteria.hasUpper && passwordCriteria.hasLower ? 'text-emerald-400' : ''}>
                        • Upper & lower case
                      </span>
                      <span className={passwordCriteria.hasNumber ? 'text-emerald-400' : ''}>
                        • Numbers included
                      </span>
                      <span className={passwordCriteria.hasSpecial ? 'text-emerald-400' : ''}>
                        • Special character (!@#)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration & Order'}
              </button>
            </form>
          )}

          {/* TAB 2: CUSTOMER LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Email or Phone Number</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="customer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Demo Customer Autofill */}
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px]">Testing demo account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@gmail.com');
                    setPassword('Password123!');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] underline"
                >
                  Fill Sample Customer
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In to Account'}
              </button>
            </form>
          )}

          {/* TAB 3: STAFF PORTAL (CASHIER / ADMIN) */}
          {tab === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="mt-5 space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">Access Role Toggle</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffRole('cashier');
                      setStaffIdentifier('cashier@savourpulao.com');
                      setStaffPassword('Password123!');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      staffRole === 'cashier'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>Cashier (In-Store POS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffRole('admin');
                      setStaffIdentifier('admin@savourpulao.com');
                      setStaffPassword('Password123!');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      staffRole === 'admin'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>Store Administrator</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Staff Work Email</label>
                <input
                  type="email"
                  required
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Security Passcode</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed">
                ℹ️ Standard seeded credentials: <strong>{staffIdentifier}</strong> / <strong>Password123!</strong>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : `Enter ${staffRole === 'cashier' ? 'Cashier POS Terminal' : 'Admin Control Center'}`}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
