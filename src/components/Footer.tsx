import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Truck, CreditCard, Lock, PhoneCall, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView, setSelectedCategorySlug, settings, setIsAuthModalOpen } = useStore();

  return (
    <footer className="w-full bg-[#08090c] border-t border-zinc-800/80 text-zinc-400 text-sm">
      {/* 4 Trust Pillars */}
      <div className="border-b border-zinc-800/50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">Fixed KSh 100 Delivery</p>
              <p className="text-xs text-zinc-500 mt-1">Karatina & environs within 30–45 minutes.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">100% Authentic Spirits</p>
              <p className="text-xs text-zinc-500 mt-1">Directly sourced sealed duty-paid stock.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">Instant PalPluss M-Pesa</p>
              <p className="text-xs text-zinc-500 mt-1">Fast STK push prompt directly to your phone.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">18+ Strict Verification</p>
              <p className="text-xs text-zinc-500 mt-1">Verified delivery with zero underage sales.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-xl font-serif font-bold text-white mb-2">{settings.storeName}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Kenya&apos;s leading online boutique for fine single malts, reserve rums, artisanal gins, tequila, and craft barware.
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-[#d4af37]" />
              {settings.supportPhone}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
              {settings.supportEmail}
            </span>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Shop Categories</h5>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => { setSelectedCategorySlug('whisky'); setActiveView('store'); }}
                className="hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                Whisky & Single Malts
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedCategorySlug('gin'); setActiveView('store'); }}
                className="hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                Botanical Gins
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedCategorySlug('tequila'); setActiveView('store'); }}
                className="hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                Añejo & Reposado Tequilas
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedCategorySlug('rum'); setActiveView('store'); }}
                className="hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                Dark & Spiced Caribbean Rum
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedCategorySlug('gifts'); setActiveView('store'); }}
                className="hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                Luxury Gift Sets & Barware
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Customer Service</h5>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => setActiveView('track-order')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Track Your Delivery
              </button>
            </li>
            <li>
              <button onClick={() => setIsAuthModalOpen(true)} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Sign In / My Orders
              </button>
            </li>
            <li>
              <span className="text-zinc-500">Delivery Policy (Fixed KSh 100 across Kenya)</span>
            </li>
            <li>
              <span className="text-zinc-500">Authenticity Guarantee</span>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Staff & Security</h5>
          <p className="text-xs text-zinc-500 mb-3">
            Store management and order dispatchers can access the operational dashboard below.
          </p>
          <button
            onClick={() => {
              setActiveView('admin');
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-[#d4af37]/40 text-zinc-300 hover:text-[#d4af37] text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin & Operations Portal</span>
          </button>
        </div>
      </div>

      {/* Mandatory Kenyan Alcoholic Beverage Legal Disclaimer */}
      <div className="bg-[#050608] border-t border-zinc-900 py-6 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
            STRICTLY 18+ · DRINK RESPONSIBLY
          </p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Excessive consumption of alcohol is harmful to your health. Strictly not for sale to persons under the age of 18 years. Delivery drivers are required to verify identification upon handover.
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 pt-2">
            <span>&copy; {new Date().getFullYear()} {settings.storeName} Kenya</span>
            <span>·</span>
            <span>Powered by PalPluss STK Push</span>
            <span>·</span>
            <span>All Prices in KES (KSh)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
