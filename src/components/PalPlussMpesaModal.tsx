import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES, formatKenyanPhone } from '../utils/formatters';
import { Smartphone, CheckCircle2, XCircle, Loader2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

export const PalPlussMpesaModal: React.FC = () => {
  const {
    isPalPlussModalOpen,
    currentStkTransaction,
    simulatePalPlussAction,
    cancelPalPlussPayment,
  } = useStore();

  const [countdown, setCountdown] = useState(45);
  const [isProcessingSim, setIsProcessingSim] = useState(false);

  useEffect(() => {
    if (!isPalPlussModalOpen) {
      setCountdown(45);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPalPlussModalOpen]);

  if (!isPalPlussModalOpen || !currentStkTransaction) return null;

  const isSuccess = currentStkTransaction.status === 'SUCCESS';
  const isCancelled = currentStkTransaction.status === 'CANCELLED' || countdown === 0;

  const handleSimulate = async (action: 'SUCCESS' | 'CANCELLED') => {
    setIsProcessingSim(true);
    await simulatePalPlussAction(action);
    setIsProcessingSim(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121319] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-center">
        {/* Decorative ambient ring */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#00A859]/10 rounded-full blur-2xl pointer-events-none" />

        {isSuccess ? (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Payment Confirmed
              </span>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">
                M-Pesa STK Push Successful
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                PalPluss verified payment for Order #{currentStkTransaction.orderNumber}
              </p>
            </div>

            <div className="p-4 bg-[#0d0e12] border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-300 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">M-Pesa Receipt</span>
                <span className="font-mono font-bold text-white tracking-wider">
                  {currentStkTransaction.receipt || 'QGH82KL91M'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid</span>
                <span className="font-bold text-[#d4af37] tabular-nums">
                  {formatKES(currentStkTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sender Phone</span>
                <span className="font-medium text-zinc-300">
                  {formatKenyanPhone(currentStkTransaction.phone)}
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-400/90 animate-pulse">
              Redirecting to Order Confirmation receipt...
            </p>
          </div>
        ) : isCancelled ? (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-white">Payment Request Timed Out</h3>
              <p className="text-xs text-zinc-400 mt-1">
                The M-Pesa prompt was cancelled or expired on your phone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelPalPlussPayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close & Return
              </button>
              <button
                onClick={() => handleSimulate('SUCCESS')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#d4af37] text-black text-xs font-semibold hover:brightness-110 transition-colors cursor-pointer"
              >
                Retry Payment
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-5">
            {/* Phone Pulse Visual */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00A859]/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-[#181a22] border-2 border-[#00A859] flex items-center justify-center text-[#00A859] shadow-lg shadow-[#00A859]/20">
                <Smartphone className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/30 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PalPluss M-Pesa STK Push</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
                Check Your Phone
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto leading-relaxed">
                An M-Pesa PIN prompt has been sent to{' '}
                <strong className="text-white">{formatKenyanPhone(currentStkTransaction.phone)}</strong>
              </p>
            </div>

            {/* Prompt Instructions Box */}
            <div className="bg-[#0b0c10] border border-zinc-800 rounded-xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-500">Order Number</span>
                <span className="font-mono text-zinc-200">{currentStkTransaction.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-500">Amount (Spirits + KSh 100 Delivery)</span>
                <span className="font-bold text-[#d4af37] text-sm tabular-nums">
                  {formatKES(currentStkTransaction.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Gateway Ref</span>
                <span className="font-mono text-[11px] text-zinc-400">{currentStkTransaction.reference}</span>
              </div>
            </div>

            {/* Step by step prompt instructions */}
            <ol className="text-left text-xs text-zinc-400 space-y-1.5 bg-[#161821] p-3.5 rounded-xl border border-zinc-800/60">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Unlock your phone screen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Enter your 4-digit M-Pesa PIN when prompted</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Press OK and wait for instant confirmation below</span>
              </li>
            </ol>

            {/* Countdown timer & listening indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A859]" />
              <span>Awaiting PalPluss Webhook Callback ({countdown}s)...</span>
            </div>

            {/* Developer / Sandbox Simulation Controls for quick test */}
            <div className="pt-2 border-t border-zinc-800/80">
              <p className="text-[11px] text-zinc-500 mb-2">
                PalPluss Sandbox / Demo Controls:
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isProcessingSim}
                  onClick={() => handleSimulate('SUCCESS')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#00A859] hover:bg-[#008f4c] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#00A859]/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulate PIN Entered (Pay)</span>
                </button>
                <button
                  disabled={isProcessingSim}
                  onClick={() => handleSimulate('CANCELLED')}
                  className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-all cursor-pointer"
                >
                  Simulate Cancel
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={cancelPalPlussPayment}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Change payment details or cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
