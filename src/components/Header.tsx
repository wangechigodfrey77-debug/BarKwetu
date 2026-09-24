import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, User as UserIcon, Shield, Search, PackageCheck, Bike } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cart,
    setIsCartOpen,
    currentUser,
    setIsAuthModalOpen,
    setSelectedCategorySlug,
    settings,
  } = useStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0e12]/90 backdrop-blur-md border-b border-zinc-800/80">
      {/* Top micro delivery banner */}
      <div className="w-full bg-[#14151b] border-b border-zinc-800/40 py-1 px-4 text-center text-xs text-zinc-300">
        <span className="text-[#d4af37] font-medium">⚡ Same-Day Nairobi Express Delivery</span>
        <span className="mx-2 text-zinc-600">·</span>
        <span>Fixed KSh 100 on all orders</span>
        <span className="mx-2 text-zinc-600">·</span>
        <span className="text-zinc-400">Strictly 18+</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Zone */}
        <button
          onClick={() => {
            setSelectedCategorySlug(null);
            setActiveView('store');
          }}
          className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white hover:text-[#d4af37] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>{settings.storeName}</span>
          <span className="text-[#d4af37] text-lg font-sans font-light">KE</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <button
            onClick={() => {
              setSelectedCategorySlug('whisky');
              setActiveView('store');
            }}
            className="hover:text-[#d4af37] transition-colors py-1 cursor-pointer whitespace-nowrap"
          >
            Whisky
          </button>
          <button
            onClick={() => {
              setSelectedCategorySlug('gin');
              setActiveView('store');
            }}
            className="hover:text-[#d4af37] transition-colors py-1 cursor-pointer whitespace-nowrap"
          >
            Gin
          </button>
          <button
            onClick={() => {
              setSelectedCategorySlug('tequila');
              setActiveView('store');
            }}
            className="hover:text-[#d4af37] transition-colors py-1 cursor-pointer whitespace-nowrap"
          >
            Tequila
          </button>
          <button
            onClick={() => {
              setSelectedCategorySlug('rum');
              setActiveView('store');
            }}
            className="hover:text-[#d4af37] transition-colors py-1 cursor-pointer whitespace-nowrap"
          >
            Rum
          </button>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setActiveView('store');
            }}
            className="hover:text-[#d4af37] transition-colors py-1 cursor-pointer whitespace-nowrap"
          >
            All Spirits
          </button>
          <button
            onClick={() => setActiveView('track-order')}
            className={`flex items-center gap-1.5 transition-colors py-1 cursor-pointer whitespace-nowrap ${
              activeView === 'track-order' ? 'text-[#d4af37]' : 'hover:text-[#d4af37]'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Track Delivery</span>
          </button>
          <button
            onClick={() => setActiveView('rider')}
            className={`flex items-center gap-1.5 transition-colors py-1 cursor-pointer whitespace-nowrap ${
              activeView === 'rider' ? 'text-emerald-400 font-bold' : 'hover:text-emerald-400 text-zinc-300'
            }`}
          >
            <Bike className="w-4 h-4 text-emerald-400" />
            <span>Rider GPS</span>
          </button>
          <button
            onClick={() => setActiveView('admin')}
            className={`flex items-center gap-1.5 transition-colors py-1 cursor-pointer whitespace-nowrap ${
              activeView === 'admin' ? 'text-[#d4af37]' : 'hover:text-[#d4af37]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Rider mobile icon */}
          <button
            onClick={() => setActiveView(activeView === 'rider' ? 'store' : 'rider')}
            className="md:hidden p-2 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors cursor-pointer"
            title="Rider GPS App"
          >
            <Bike className="w-5 h-5" />
          </button>

          {/* Admin mobile icon */}
          <button
            onClick={() => setActiveView(activeView === 'admin' ? 'store' : 'admin')}
            className="md:hidden p-2 text-zinc-300 hover:text-[#d4af37] rounded-lg transition-colors cursor-pointer"
            title="Admin Portal"
          >
            <Shield className="w-5 h-5 text-[#d4af37]" />
          </button>

          {/* Track order mobile link */}
          <button
            onClick={() => setActiveView('track-order')}
            className="md:hidden p-2 text-zinc-300 hover:text-[#d4af37] rounded-lg transition-colors cursor-pointer"
            title="Track Delivery"
          >
            <PackageCheck className="w-5 h-5" />
          </button>

          {/* User Account / Admin / Rider Button */}
          {currentUser ? (
            currentUser.role === 'admin' || currentUser.role === 'superadmin' ? (
              <button
                onClick={() => setActiveView(activeView === 'admin' ? 'store' : 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            ) : currentUser.role === 'rider' ? (
              <button
                onClick={() => setActiveView('rider')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Rider App</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="max-w-[80px] truncate">{currentUser.fullName.split(' ')[0]}</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Shopping Cart Drawer Toggle */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs sm:text-sm rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#d4af37]/10 whitespace-nowrap"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Basket</span>
            {totalCartCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-[#d4af37] text-[11px] font-bold rounded-full tabular-nums">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

