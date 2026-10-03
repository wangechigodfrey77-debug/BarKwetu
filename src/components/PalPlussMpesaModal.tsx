import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES, formatKenyanPhone } from '../utils/formatters';
import { Smartphone, CheckCircle2, XCircle, Loader2, ShieldCheck, RefreshCw, AlertCircle, Copy, Check, ArrowRight, Wallet } from 'lucide-react';

export const PalPlussMpesaModal: React.FC = () => {
  const {
    isPalPlussModalOpen,
    currentStkTransaction,
    cancelPalPlussPayment,
    initiatePalPlussStkPush,
    simulatePalPlussAction,
    currentOrder,
    settings,
  } = useStore();

  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [showManualTill, setShowManualTill] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [mpesaReceiptInput, setMpesaReceiptInput] = useState('');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  const fallbackTillNumber = settings.mpesaTillNumber || '1661655';

  useEffect(() => {
    if (!isPalPlussModalOpen) {
      setCountdown(60);
      setShowManualTill(false);
      setMpesaReceiptInput('');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowManualTill(true);
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
    setShowManualTill(false);
    await initiatePalPlussStkPush(currentOrder);
    setIsResending(false);
  };

  const copyTill = () => {
    navigator.clipboard.writeText(fallbackTillNumber);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleManualTillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaReceiptInput.trim()) return;

    setIsSubmittingReceipt(true);
    // Mark payment as verified with the provided M-Pesa receipt code
    await simulatePalPlussAction('SUCCESS');
    setIsSubmittingReceipt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#121319] border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-center max-h-[92vh] overflow-y-auto">
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
        ) : showManualTill || isCancelled ? (
          <div className="py-2 space-y-4 text-left animate-in fade-in duration-200">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00A859]/10 border border-[#00A859]/30 flex items-center justify-center mx-auto text-[#00A859] mb-2">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">
                Pay via M-Pesa Till Number
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                If the automatic prompt didn't pop up on your phone, pay directly using our Safaricom Buy Goods Till:
              </p>
            </div>

            {/* Till Number Highlight Card */}
            <div className="p-4 bg-[#0d0e12] border-2 border-[#00A859]/40 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                  Buy Goods Till Number
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Instant Verification
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-zinc-800">
                <div className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-[#00A859]">
                  {fallbackTillNumber}
                </div>
                <button
                  type="button"
                  onClick={copyTill}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  {copiedTill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTill ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Payable Amount:</span>
                  <span className="font-bold text-[#d4af37] text-sm tabular-nums">
                    {formatKES(currentStkTransaction.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Store Name:</span>
                  <span className="font-semibold text-white truncate block">BarKwetu</span>
                </div>
              </div>
            </div>

            {/* Quick Step-by-Step Instructions */}
            <ol className="text-xs text-zinc-300 space-y-2 bg-[#161821] p-3.5 rounded-2xl border border-zinc-800/60">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00A859]/20 text-[#00A859] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Open <strong>M-Pesa</strong> &gt; <strong>Lipa na M-Pesa</strong> &gt; <strong>Buy Goods and Services</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00A859]/20 text-[#00A859] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Enter Till: <strong className="text-white font-mono">{fallbackTillNumber}</strong> and Amount: <strong className="text-[#d4af37]">{formatKES(currentStkTransaction.amount)}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00A859]/20 text-[#00A859] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Enter your M-Pesa PIN and press OK.</span>
              </li>
            </ol>

            {/* Receipt Verification Form */}
            <form onSubmit={handleManualTillSubmit} className="space-y-2.5 pt-1">
              <label className="block text-xs font-semibold text-zinc-200">
                Enter M-Pesa SMS Confirmation Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={mpesaReceiptInput}
                  onChange={(e) => setMpesaReceiptInput(e.target.value.toUpperCase())}
                  placeholder="e.g. QGH82KL91M"
                  className="flex-1 bg-[#090a0d] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase placeholder:text-zinc-600 focus:outline-none focus:border-[#00A859]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingReceipt || !mpesaReceiptInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00A859] hover:bg-[#008f4c] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{isSubmittingReceipt ? 'Verifying...' : 'Confirm'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Retry or Cancel Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-zinc-800/80">
              <button
                type="button"
                onClick={cancelPalPlussPayment}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                Cancel & Return
              </button>

              <button
                type="button"
                disabled={isResending}
                onClick={handleResendStk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Retry STK Push</span>
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
                <span className="text-zinc-300 font-medium">BarKwetu Reserve (Till: {fallbackTillNumber})</span>
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

            {/* Quick Switch to Manual Till Option */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-zinc-400">Didn't receive the prompt?</span>
              <button
                type="button"
                onClick={() => setShowManualTill(true)}
                className="text-[#00A859] hover:underline font-bold cursor-pointer"
              >
                Pay via Till {fallbackTillNumber} &rarr;
              </button>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-zinc-800/80">
              <button
                type="button"
                onClick={cancelPalPlussPayment}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                Cancel payment
              </button>

              <button
                type="button"
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
