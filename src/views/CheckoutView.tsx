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
    setCurrentUser,
    setActiveView,
    createPendingOrder,
    initiatePalPlussPayment,
    openAuthModal,
    loginWithGoogle,
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

  // Auto sync user fields if current user updates
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

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

  // If user is not logged in, show a dedicated account requirement prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#090a0d] py-12 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setActiveView('store')}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </button>

          <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-bold text-white mb-1.5">
                Sign In or Register to Checkout
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                BarKwetu requires an account to secure M-Pesa automated callbacks, real-time rider tracking, and age compliance.
              </p>
            </div>

            {/* Cart Preview Badge */}
            <div className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
                <div>
                  <p className="text-xs font-semibold text-white">Basket Total</p>
                  <p className="text-[11px] text-zinc-400">{cart.reduce((s, i) => s + i.quantity, 0)} spirits items</p>
                </div>
              </div>
              <span className="text-base font-bold text-[#d4af37] tabular-nums">
                {formatKES(cartTotal)}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => openAuthModal('signin', 'checkout')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In to Existing Account</span>
              </button>

              <button
                onClick={() => openAuthModal('signup', 'checkout')}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
              >
                <span>Create New Customer Account</span>
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="w-full border-t border-zinc-800 absolute" />
                <span className="bg-[#121318] px-3 text-[11px] text-zinc-500 uppercase relative">
                  Or instant
                </span>
              </div>

              <button
                onClick={loginWithGoogle}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setFormError('Please provide a valid 10-digit Kenyan phone number for M-Pesa.');
      return;
    }

    if (!currentUser) {
      const newCustomer = {
        id: `user-cust-${Date.now()}`,
        fullName: fullName.trim(),
        username: fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'customer',
        email: `${cleanPhone}@barkwetu.co.ke`,
        phone: phone.trim(),
        role: 'customer' as const,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(newCustomer);
    }

    if (!fullName.trim() || !phone.trim() || !exactLocation.trim()) {
      setFormError('Please provide your Full Name, Phone Number, and Exact Street Address.');
      return;
    }

    if (!ageConfirmChecked) {
      setFormError('You must confirm you are 18 years or older to receive alcoholic beverages.');
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
                            loading="lazy"
                            decoding="async"
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
