import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES, formatDateTime, formatKenyanPhone } from '../utils/formatters';
import { getTierMultiplier } from '../utils/loyaltyUtils';
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  ArrowRight,
  Share2,
  Printer,
  Smartphone,
  MapPin,
  Clock,
  Coins,
  Gift,
} from 'lucide-react';

export const OrderConfirmationView: React.FC = () => {
  const { currentOrder, setActiveView, currentUser, openProfileModal } = useStore();

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-[#090a0d] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-[#121318] border border-zinc-800 rounded-2xl p-8">
          <p className="text-zinc-400 mb-4">No recent order found.</p>
          <button
            onClick={() => setActiveView('store')}
            className="py-2.5 px-6 rounded-xl bg-[#d4af37] text-black font-semibold text-xs cursor-pointer"
          >
            Go to Store
          </button>
        </div>
      </div>
    );
  }

  const earnedCoins = Math.max(
    1,
    Math.round((currentOrder.subtotal / 100) * getTierMultiplier(currentUser?.loyaltyTier || 'Bronze'))
  );

  const handleShareWhatsApp = () => {
    const text = `Order confirmed on BarKwetu! Order #${currentOrder.orderNumber} for ${formatKES(currentOrder.total)}. Track: https://barkwetu.co.ke/track/${currentOrder.orderNumber}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#090a0d] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Banner */}
        <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold">
            M-Pesa Payment Confirmed
          </span>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mt-1 mb-2">
            Asante Sana for Your Order!
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Your spirits are currently being packed into thermal temperature-controlled packaging at our Karatina cellar.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 p-3 bg-[#0d0e12] border border-zinc-800 rounded-xl text-xs">
            <div className="px-3 py-1">
              <span className="text-zinc-500 block text-[10px] uppercase">Order Number</span>
              <span className="font-mono font-bold text-white text-sm">{currentOrder.orderNumber}</span>
            </div>
            <div className="border-x border-zinc-800 px-3 py-1">
              <span className="text-zinc-500 block text-[10px] uppercase">M-Pesa Receipt</span>
              <span className="font-mono font-bold text-[#00A859] text-sm">
                {currentOrder.mpesaDetails?.receiptNumber || 'QGH82KL91M'}
              </span>
            </div>
            <div className="px-3 py-1">
              <span className="text-zinc-500 block text-[10px] uppercase">Delivery Window</span>
              <span className="font-semibold text-[#d4af37]">25–35 Mins Express</span>
            </div>
          </div>

          {/* Loyalty Points Earned Showcase Banner */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#181924] via-[#1f2030] to-[#181924] border border-[#d4af37]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>+{earnedCoins} Kwetu Coins Credited!</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    Added to Wallet
                  </span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  {currentUser ? `Current balance: ${currentUser.kwetuCoins ?? 0} Kwetu Coins` : 'Redeemable for discount vouchers in your profile'}
                </p>
              </div>
            </div>

            <button
              onClick={() => openProfileModal('coins')}
              className="py-2 px-4 rounded-lg bg-[#d4af37] text-black hover:brightness-110 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-[#d4af37]/20"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Open Loyalty Wallet</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setActiveView('track-order')}
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Track Delivery Progress Live</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-3.5 px-6 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        {/* Receipt Details Card */}
        <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] pb-3 border-b border-zinc-800">
            Order Receipt Summary
          </h3>

          {/* Items */}
          <div className="space-y-3">
            {currentOrder.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0b0c10] rounded-lg p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.productName}</p>
                    <p className="text-zinc-500 text-[11px]">{item.volume} · Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-white tabular-nums">
                  {formatKES(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-zinc-200 tabular-nums">{formatKES(currentOrder.subtotal)}</span>
            </div>
            {currentOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount Applied</span>
                <span className="tabular-nums">-{formatKES(currentOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Fixed Delivery Fee (Nairobi & Kenya)</span>
              <span className="text-zinc-200 tabular-nums">{formatKES(currentOrder.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
              <span>Total Paid via PalPluss</span>
              <span className="text-base text-[#d4af37] tabular-nums">{formatKES(currentOrder.total)}</span>
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 bg-[#0d0e12] border border-zinc-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-300">
            <div>
              <p className="text-zinc-500 font-semibold mb-1 uppercase text-[10px]">Recipient</p>
              <p className="font-medium text-white">{currentOrder.shippingAddress.fullName}</p>
              <p>{formatKenyanPhone(currentOrder.shippingAddress.phone)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-semibold mb-1 uppercase text-[10px]">Delivery Address</p>
              <p>{currentOrder.shippingAddress.exactLocation}</p>
              <p className="text-zinc-400">
                {currentOrder.shippingAddress.town}, {currentOrder.shippingAddress.county}
              </p>
            </div>
          </div>
        </div>

        {/* Back to store */}
        <div className="text-center">
          <button
            onClick={() => setActiveView('store')}
            className="text-xs text-zinc-400 hover:text-[#d4af37] transition-colors cursor-pointer"
          >
            ← Back to BarKwetu Store
          </button>
        </div>
      </div>
    </div>
  );
};
