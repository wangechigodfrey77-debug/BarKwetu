import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Lock, Mail, User, Phone, Shield, ArrowRight, Bike } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    loginWithPassword,
    loginWithGoogle,
    signupWithPassword,
    logout,
    setActiveView,
  } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    const res = await loginWithPassword(identifier, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid username or password.');
    } else {
      if (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@barkwetu.co.ke') {
        setActiveView('admin');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName || !email || !username || !signupPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    const res = await signupWithPassword({
      fullName,
      email,
      username,
      password: signupPassword,
      phone,
    });
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Error creating account.');
    }
  };

  const handleQuickAdminLogin = async () => {
    setIdentifier('admin');
    setPassword('admin123');
    setIsLoading(true);
    await loginWithPassword('admin', 'admin123');
    setIsLoading(false);
    setActiveView('admin');
  };

  const handleQuickRiderLogin = async () => {
    setIdentifier('rider');
    setPassword('rider123');
    setIsLoading(true);
    await loginWithPassword('rider', 'rider123');
    setIsLoading(false);
    setActiveView('rider');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121318] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          // Logged in profile overview
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#1c1e26] border border-[#d4af37]/40 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-1">
              {currentUser.fullName}
            </h3>
            <p className="text-xs text-zinc-400 mb-2">{currentUser.email}</p>
            <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 mb-6">
              Role: {currentUser.role}
            </div>

            <div className="space-y-3">
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setActiveView('admin');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#d4af37] text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Open Admin Operations Panel</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setActiveView('track-order');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>My Orders & Track Delivery</span>
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-900/50 hover:bg-rose-950/40 text-rose-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
                {mode === 'signin' ? 'Welcome to BarKwetu' : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'signin'
                  ? 'Sign in to access rapid checkout & order tracking'
                  : 'Join for priority Nairobi delivery and exclusive reserve allocations'}
              </p>
            </div>

            {/* Quick Google Auth Button */}
            <button
              onClick={loginWithGoogle}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-[1px] bg-zinc-800" />
              <span className="text-[11px] text-zinc-500 uppercase">Or continue with</span>
              <div className="flex-1 h-[1px] bg-zinc-800" />
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[#0b0c10] border border-zinc-800 rounded-xl mb-4">
              <button
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'signin' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'signup' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 mb-4 bg-rose-950/40 border border-rose-800/40 rounded-lg text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. admin or your email"
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#d4af37]/20"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Quick Account Helper Pills */}
                <div className="pt-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={handleQuickRiderLogin}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 hover:border-emerald-500 text-emerald-400 text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Quick Fill Delivery Rider (`rider` / `rider123`)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickAdminLogin}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#d4af37]/40 text-zinc-400 hover:text-[#d4af37] text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3 h-3 text-[#d4af37]" />
                    <span>Quick Fill Super-Admin (`admin` / `admin123`)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Kamau"
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.ke"
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="jkamau"
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#d4af37]/20 mt-2"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Complete Sign Up'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
