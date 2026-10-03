import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES, formatKenyanPhone } from '../utils/formatters';
import { Smartphone, CheckCircle2, XCircle, Loader2, ShieldCheck, RefreshCw, AlertCircle, PhoneCall } from 'lucide-react';

export const PalPlussMpesaModal: React.FC = () => {
  const {
    isPalPlussModalOpen,
    currentStkTransaction,
    cancelPalPlussPayment,
    initiatePalPlussStkPush,
    currentOrder,
  } = useStore();

  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!isPalPlussModalOpen) {
      setCountdown(60);
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

  const handleResendStk = async () => {
    if (!currentOrder) return;
    setIsResending(true);
    setCountdown(60);
    await initiatePalPlussStkPush(currentOrder);
    setIsResending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#121319] border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-center">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 bg-[#00A859]/15 rounded-full blur-3xl pointer-events-none" />

        {isSuccess ? (
          <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Payment Verified
              </span>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">
                M-Pesa Payment Received!
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Transaction confirmed for Order #{currentStkTransaction.orderNumber}
              </p>
            </div>

            <div className="p-4 bg-[#0d0e12] border border-zinc-800 rounded-2xl space-y-2.5 text-xs text-zinc-300 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">M-Pesa Receipt</span>
                <span className="font-mono font-bold text-white tracking-wider">
                  {currentStkTransaction.receipt || 'VERIFIED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid</span>
                <span className="font-bold text-[#d4af37] tabular-nums">
                  {formatKES(currentStkTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone Number</span>
                <span className="font-medium text-zinc-300 font-mono">
                  {formatKenyanPhone(currentStkTransaction.phone)}
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-400/90 animate-pulse">
              Finalizing dispatch and redirecting to receipt...
            </p>
          </div>
        ) : isCancelled ? (
          <div className="py-4 space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-white">M-Pesa Prompt Expired</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                The prompt was not completed in time or was dismissed on your phone.
              </p>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-300/90 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Ensure your phone is unlocked and has active Safaricom network reception.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={cancelPalPlussPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel / Return
              </button>
              <button
                disabled={isResending}
                onClick={handleResendStk}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00A859] text-white text-xs font-bold hover:brightness-110 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending...' : 'Resend M-Pesa Prompt'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-5">
            {/* Real M-Pesa Prompt Animated Phone Visual */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00A859]/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-[#181a22] border-2 border-[#00A859] flex items-center justify-center text-[#00A859] shadow-lg shadow-[#00A859]/30">
                <Smartphone className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/30 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Real M-Pesa Push Prompt Sent</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
                Enter Your M-Pesa PIN
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto leading-relaxed">
                A secure Safaricom M-Pesa payment prompt has been sent to{' '}
                <strong className="text-white font-mono">{formatKenyanPhone(currentStkTransaction.phone)}</strong>
              </p>
            </div>

            {/* Order & Amount Box */}
            <div className="bg-[#0b0c10] border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-500">Order Reference</span>
                <span className="font-mono text-zinc-200">#{currentStkTransaction.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-500">Payable Amount</span>
                <span className="font-bold text-[#d4af37] text-sm tabular-nums">
                  {formatKES(currentStkTransaction.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Recipient</span>
                <span className="text-zinc-300 font-medium">BarKwetu Reserve Karatina</span>
              </div>
            </div>

            {/* Clear Real Phone Instructions */}
            <div className="text-left text-xs text-zinc-400 space-y-2 bg-[#161821] p-3.5 rounded-2xl border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00A859]/20 text-[#00A859] text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Check your phone screen for the Safaricom pop-up prompt.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00A859]/20 text-[#00A859] text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Enter your 4-digit M-Pesa PIN and press OK.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00A859]/20 text-[#00A859] text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Your order will confirm automatically upon PIN entry.</span>
              </div>
            </div>

            {/* Active Live Polling Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A859]" />
              <span>Waiting for M-Pesa PIN authorization ({countdown}s)...</span>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-zinc-800/80">
              <button
                onClick={cancelPalPlussPayment}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                Cancel payment
              </button>

              <button
                disabled={isResending}
                onClick={handleResendStk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Prompt</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
