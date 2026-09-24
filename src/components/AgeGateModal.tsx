import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldAlert, Check, X, Wine } from 'lucide-react';

export const AgeGateModal: React.FC = () => {
  const { isAgeGateOpen, verifyAge } = useStore();
  const [underageBlocked, setUnderageBlocked] = useState(false);

  if (!isAgeGateOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121318] border border-[#2e2f38] rounded-2xl p-8 sm:p-10 text-center shadow-2xl overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-[#c8963e]/10 rounded-full blur-3xl pointer-events-none" />

        {!underageBlocked ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1c1e26] border border-[#d4af37]/30 flex items-center justify-center mb-6 text-[#d4af37]">
              <Wine className="w-8 h-8" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold mb-2">
              Age Verification Required
            </span>

            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-3">
              Are you 18 years or older?
            </h2>

            <p className="text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
              BarKwetu is Kenya&apos;s premier alcohol merchant. In compliance with the Alcoholic Drinks Control Act, you must be of legal drinking age (18+) to view and purchase.
            </p>

            <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => verifyAge(true)}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Yes, I am 18+</span>
              </button>

              <button
                onClick={() => {
                  setUnderageBlocked(true);
                  verifyAge(false);
                }}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#1c1e26] border border-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>No, Under 18</span>
              </button>
            </div>

            <p className="mt-8 text-xs text-zinc-500">
              Drink Responsibly. Excessive consumption of alcohol is harmful to your health. Strictly not for sale to persons under 18.
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-800/40 flex items-center justify-center mb-6 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
              Access Restricted
            </h2>

            <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
              Sorry, you must be 18 years or older to enter BarKwetu. You cannot browse or purchase alcoholic beverages on this website.
            </p>

            <button
              onClick={() => {
                window.location.href = 'https://www.google.com';
              }}
              className="py-3 px-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              Exit Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
