import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { KENYA_COUNTIES } from '../data/kenyaLocations';
import { formatKES } from '../utils/formatters';
import { ShippingAddress } from '../types';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Smartphone,
  Lock,
  MapPin,
  FileText,
  User as UserIcon,
  ShoppingBag,
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    discountAmount,
    cartTotal,
    appliedPromo,
    currentUser,
    setActiveView,
    createPendingOrder,
    initiatePalPlussPayment,
    setIsAuthModalOpen,
  } = useStore();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '07');
  const [county, setCounty] = useState('Nyeri');
  const [town, setTown] = useState('Karatina CBD / Commercial Street');
  const [exactLocation, setExactLocation] = useState('');
  const [buildingOrLandmark, setBuildingOrLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [ageConfirmChecked, setAgeConfirmChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Towns for selected county
  const selectedCountyObj = KENYA_COUNTIES.find((c) => c.name === county);
  const availableTowns = selectedCountyObj ? selectedCountyObj.towns : [];

  useEffect(() => {
    if (availableTowns.length > 0 && !availableTowns.includes(town)) {
      setTown(availableTowns[0]);
    }
  }, [county, availableTowns, town]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#090a0d] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-[#121318] border border-zinc-800 rounded-2xl p-8">
          <ShoppingBag className="w-16 h-16 stroke-1 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Your Basket is Empty</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Please add some spirits to your basket before proceeding to checkout.
          </p>
          <button
            onClick={() => setActiveView('store')}
            className="py-3 px-6 rounded-xl bg-[#d4af37] text-black font-semibold text-xs transition-colors cursor-pointer"
          >
            Explore Reserve Spirits
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!fullName.trim() || !phone.trim() || !exactLocation.trim()) {
      setFormError('Please provide your Full Name, Phone Number, and Exact Street Address.');
      return;
    }

    if (!ageConfirmChecked) {
      setFormError('You must confirm you are 18 years or older to receive alcoholic beverages.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setFormError('Please provide a valid 10-digit Kenyan phone number for M-Pesa.');
      return;
    }

    setIsSubmitting(true);

    const shippingAddress: ShippingAddress = {
      fullName,
      phone,
      county,
      town,
      exactLocation,
      buildingOrLandmark,
      deliveryNotes,
    };

    // Create pending order
    const order = createPendingOrder(shippingAddress);

    // Trigger PalPluss M-Pesa STK Push
    await initiatePalPlussPayment(order);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#090a0d] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => setActiveView('store')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#d4af37] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4" />
                <span>1. Kenyan Delivery Destination</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight mb-6">
                Shipping & Contact Information
              </h2>

              {formError && (
                <div className="mb-6 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Recipient Full Name <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dennis Kiprop"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    M-Pesa Phone Number (for PalPluss STK Push) <span className="text-[#d4af37]">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-[#00A859]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678 or 2547..."
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    The PalPluss M-Pesa prompt will be sent directly to this phone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      County <span className="text-[#d4af37]">*</span>
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full bg-[#090a0d] border border-zinc-800 text-zinc-200 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} County
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Town / Neighborhood Area <span className="text-[#d4af37]">*</span>
                    </label>
                    <select
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      className="w-full bg-[#090a0d] border border-zinc-800 text-zinc-200 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                    >
                      {availableTowns.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Exact Street Address & House/Apartment No. <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={exactLocation}
                    onChange={(e) => setExactLocation(e.target.value)}
                    placeholder="e.g. Ring Road Parklands, Westgate Plaza, Apt 4B"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Prominent Landmark or Gate Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={buildingOrLandmark}
                    onChange={(e) => setBuildingOrLandmark(e.target.value)}
                    placeholder="e.g. Black gate next to Shell Petrol Station"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Special Rider Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call upon arrival at security barrier."
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* 18+ Verification checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={ageConfirmChecked}
                      onChange={(e) => setAgeConfirmChecked(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-[#d4af37] focus:ring-[#d4af37]"
                    />
                    <span>
                      I confirm that the recipient is <strong>18 years of age or older</strong>. I understand our delivery dispatch driver will request National ID / Passport upon handover.
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Payment Method Badge */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00A859] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Payment Gateway</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-3">
                M-Pesa STK Push via PalPluss
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Instant encrypted mobile checkout. Once you click &quot;Pay with PalPluss M-Pesa&quot;, an STK push notification will instantly appear on your phone to enter your PIN.
              </p>
              <div className="flex items-center gap-3 p-3 bg-[#0d0e12] border border-zinc-800 rounded-xl text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-[#00A859] animate-ping" />
                <span>PalPluss Gateway Connected · Fixed KSh 100 Delivery Included</span>
              </div>
            </div>
          </div>

          {/* Right Order Review (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl sticky top-24">
              <h3 className="font-serif text-xl font-bold text-white mb-4">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                {cart.map((item) => {
                  const effectivePrice = item.product.salePrice ?? item.product.price;
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 text-xs pb-3 border-b border-zinc-800/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-[#0b0c10] rounded-lg p-1 flex items-center justify-center shrink-0">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-200 truncate">{item.product.name}</p>
                          <p className="text-zinc-500 text-[11px]">
                            {item.product.volume} · Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-white tabular-nums shrink-0">
                        {formatKES(effectivePrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-200 font-medium tabular-nums">{formatKES(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo Discount ({appliedPromo?.code})</span>
                    <span className="font-medium tabular-nums">-{formatKES(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Fixed Kenya Delivery Fee</span>
                  </span>
                  <span className="text-zinc-200 font-medium tabular-nums">{formatKES(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-zinc-800">
                  <span>Total Amount</span>
                  <span className="text-lg text-[#d4af37] tabular-nums">{formatKES(cartTotal)}</span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#d4af37]/20 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmitting ? 'Initiating STK Push...' : `Pay ${formatKES(cartTotal)} with M-Pesa`}</span>
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-zinc-500">
                  Guaranteed 256-bit SSL encryption. Powered by PalPluss STK Push API.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
