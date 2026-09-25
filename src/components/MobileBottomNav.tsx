import React from 'react';
import { useStore } from '../context/StoreContext';
import { Store, PackageCheck, Bike, ShoppingBag, User as UserIcon } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cart,
    setIsCartOpen,
    currentUser,
    setIsAuthModalOpen,
  } = useStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e12]/95 backdrop-blur-lg border-t border-zinc-800 py-2 px-3 flex items-center justify-around shadow-2xl">
      {/* Store */}
      <button
        onClick={() => setActiveView('store')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
          activeView === 'store' ? 'text-[#d4af37]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] font-medium">Store</span>
      </button>

      {/* Track */}
      <button
        onClick={() => setActiveView('track-order')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
          activeView === 'track-order' ? 'text-[#d4af37]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <PackageCheck className="w-5 h-5" />
        <span className="text-[10px] font-medium">Track</span>
      </button>

      {/* Rider */}
      <button
        onClick={() => setActiveView('rider')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
          activeView === 'rider' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-emerald-400'
        }`}
      >
        <Bike className="w-5 h-5 text-emerald-400" />
        <span className="text-[10px] font-medium">Rider</span>
      </button>

      {/* Basket */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center gap-1 p-1.5 text-zinc-400 hover:text-[#d4af37] transition-colors cursor-pointer"
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[10px] font-medium">Basket</span>
        {totalCartCount > 0 && (
          <span className="absolute top-0 right-1 px-1.5 bg-[#d4af37] text-black text-[9px] font-bold rounded-full tabular-nums">
            {totalCartCount}
          </span>
        )}
      </button>

      {/* Account / Auth */}
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className="flex flex-col items-center gap-1 p-1.5 text-zinc-400 hover:text-[#d4af37] transition-colors cursor-pointer"
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] font-medium">
          {currentUser ? currentUser.fullName.split(' ')[0] : 'Sign In'}
        </span>
      </button>
    </div>
  );
};
