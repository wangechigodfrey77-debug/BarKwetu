import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import { X, Trash2, ArrowRight, Tag, ShoppingBag, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryFee,
    discountAmount,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    setActiveView,
    currentUser,
    openAuthModal,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoError('');
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!currentUser) {
      // Prompt user to sign in or create an account with checkout intent
      openAuthModal('signin', 'checkout');
    } else {
      // User is already authenticated: sail right through to the checkout page
      setActiveView('checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-[99] flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0f1015] border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl pb-16 sm:pb-0">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-serif text-xl font-bold text-white">Your Basket</h3>
            <span className="text-xs text-zinc-400 tabular-nums font-mono">
              ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <ShoppingBag className="w-16 h-16 stroke-1 text-zinc-700 mb-3" />
              <p className="font-serif text-lg text-zinc-300 mb-1">Your basket is empty</p>
              <p className="text-xs text-zinc-500 max-w-xs mb-6">
                Explore our curated selection of reserve single malts, botanical gins, and spirits.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Browse Spirits
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => {
                const effectivePrice = item.product.salePrice ?? item.product.price;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3.5 p-3.5 bg-[#14151c] border border-zinc-800/80 rounded-xl"
                  >
                    <div className="w-16 h-16 bg-[#0a0b0e] rounded-lg p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {item.product.volume} · <span className="text-[#d4af37]">{item.product.brand}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/50">
                        {/* Stepper */}
                        <div className="flex items-center bg-[#0d0e12] border border-zinc-800 rounded-lg">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-white tabular-nums">
                          {formatKES(effectivePrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Basket Button */}
              <div className="text-right pt-2">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear all items
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-zinc-800 bg-[#121319] space-y-4">
            {/* Promo Code input */}
            <div>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      Promo <strong>{appliedPromo.code}</strong> applied (-{formatKES(discountAmount)})
                    </span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-emerald-400 hover:text-rose-400 cursor-pointer text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter Promo Code (e.g. KARIBU10)"
                    className="flex-1 bg-[#090a0d] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white uppercase placeholder:normal-case placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-400 mt-1">{promoError}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-zinc-200 font-medium tabular-nums">{formatKES(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-medium tabular-nums">-{formatKES(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-[#d4af37]" />
                  <span>Fixed Delivery (Kenya)</span>
                </span>
                <span className="text-zinc-200 font-medium tabular-nums">{formatKES(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                <span>Total Amount</span>
                <span className="text-base text-[#d4af37] tabular-nums">{formatKES(cartTotal)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
