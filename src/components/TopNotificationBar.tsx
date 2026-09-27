import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

export const TopNotificationBar: React.FC = () => {
  return (
    <aside 
      aria-label="Delivery Announcement"
      className="w-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#b8860b] text-black font-semibold text-xs sm:text-sm py-2 px-4 shadow-[0_2px_15px_rgba(212,175,55,0.35)] relative z-50 border-b border-amber-600/30"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center leading-tight">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/15 text-black shrink-0">
          <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
        </span>
        <span className="tracking-tight sm:tracking-normal font-bold">
          Express delivery in and around Karatina town. Fixed 100Ksh delivery fee on all orders.
        </span>
        <span className="hidden md:inline-flex items-center gap-1 ml-2 text-[11px] font-semibold bg-black/15 px-2 py-0.5 rounded-full text-black">
          <ShieldCheck className="w-3 h-3" />
          Mathira Express Dispatch
        </span>
      </div>
    </aside>
  );
};

export default TopNotificationBar;
