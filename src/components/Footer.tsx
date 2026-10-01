import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Truck, CreditCard, Lock, PhoneCall, Mail, Shield, Bike } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView, setSelectedCategorySlug, settings, setIsAuthModalOpen, openLegalModal } = useStore();

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
            <a
              href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2 hover:text-[#d4af37] transition-colors group cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#d4af37] group-hover:scale-110 transition-transform" />
              <span className="underline decoration-zinc-800 hover:decoration-[#d4af37] underline-offset-2">{settings.supportPhone}</span>
            </a>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="flex items-center gap-2 hover:text-[#d4af37] transition-colors group cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#d4af37] group-hover:scale-110 transition-transform" />
              <span className="underline decoration-zinc-800 hover:decoration-[#d4af37] underline-offset-2">{settings.supportEmail}</span>
            </a>
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
              <span className="text-zinc-500">Fixed KSh 100 Karatina Delivery</span>
            </li>
            <li>
              <span className="text-zinc-500">100% Authentic Duty-Paid Stock</span>
            </li>
          </ul>

          <div className="mt-4 pt-3 border-t border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Staff Portal</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveView('admin')}
                className="px-2.5 py-1 rounded bg-[#13151c] hover:bg-[#1c1f2a] border border-zinc-800 hover:border-[#d4af37]/40 text-[11px] text-zinc-400 hover:text-[#d4af37] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield className="w-3 h-3 text-[#d4af37]" />
                <span>Admin Login</span>
              </button>
              <button
                onClick={() => setActiveView('rider')}
                className="px-2.5 py-1 rounded bg-[#13151c] hover:bg-[#1c1f2a] border border-zinc-800 hover:border-emerald-500/40 text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bike className="w-3 h-3 text-emerald-400" />
                <span>Rider GPS Login</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Legal & Compliance</h5>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => openLegalModal('privacy')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => openLegalModal('terms')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => openLegalModal('cookies')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Cookie Policy
              </button>
            </li>
            <li>
              <button onClick={() => openLegalModal('refund')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Refund & Cancellation
              </button>
            </li>
            <li>
              <button onClick={() => openLegalModal('minimisation')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                Data Minimisation
              </button>
            </li>
            <li>
              <button onClick={() => openLegalModal('security')} className="hover:text-[#d4af37] transition-colors cursor-pointer text-[#d4af37] font-semibold">
                Data Storage & Security
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Delivery & Dispatch Hub</h5>
          <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
            Central dispatch operating daily across Karatina Town, Mathira East & West, and surrounding environs.
          </p>
          <div className="bg-[#11131a] border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs text-zinc-300">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Dispatch Window:</span>
              <span className="font-semibold text-[#d4af37]">10:00 AM – 11:30 PM</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Delivery Speed:</span>
              <span className="font-semibold text-emerald-400">30–45 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Flat Fee:</span>
              <span className="font-semibold text-white font-mono">KSh 100 on all orders</span>
            </div>
          </div>
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
