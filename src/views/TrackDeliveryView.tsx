import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { formatKES, formatDateTime, formatKenyanPhone } from '../utils/formatters';
import { GoogleMapDeliveryTracker } from '../components/maps/GoogleMapDeliveryTracker';
import { STORE_HUB_LOCATION, resolveCoordinatesForAddress } from '../utils/kenyaLocations';
import {
  PackageCheck,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  AlertCircle,
  Wine,
  ArrowRight,
  Bike,
} from 'lucide-react';

export const TrackDeliveryView: React.FC = () => {
  const { lookupOrder, currentOrder, setActiveView } = useStore();

  const [orderNumberInput, setOrderNumberInput] = useState<string>(
    currentOrder ? currentOrder.orderNumber : 'BW-98421'
  );
  const [phoneOrEmailInput, setPhoneOrEmailInput] = useState<string>(
    currentOrder ? currentOrder.phone : '0712345678'
  );
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    currentOrder || lookupOrder('BW-98421', '0712345678')
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!orderNumberInput.trim()) {
      setErrorMessage('Please enter your BarKwetu Order Number (e.g. BW-98421).');
      return;
    }

    const found = lookupOrder(orderNumberInput, phoneOrEmailInput);
    if (!found) {
      setErrorMessage(
        `No matching order found for ${orderNumberInput}. Please check the order number or contact support at +254 700 123 456.`
      );
      setSearchedOrder(null);
    } else {
      setSearchedOrder(found);
    }
  };

  const stepsConfig: { status: OrderStatus; label: string; description: string; icon: React.ReactNode }[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      description: 'Order registered in the BarKwetu system',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      status: 'paid',
      label: 'Payment Confirmed',
      description: 'M-Pesa STK Push validated via PalPluss',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      status: 'preparing',
      label: 'Packaging & Seal',
      description: 'Inspected, boxed, and packed with thermal insulation',
      icon: <Wine className="w-4 h-4" />,
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      description: 'Dedicated BarKwetu express rider dispatched',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      description: 'Handover complete with age (18+) verification',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStatusIndex = (status: OrderStatus) => {
    const sequence: OrderStatus[] = ['pending', 'paid', 'preparing', 'out_for_delivery', 'delivered'];
    return sequence.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-[#090a0d] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-semibold uppercase tracking-wider mb-3">
            <Truck className="w-3.5 h-3.5" />
            <span>Kenya Real-Time Dispatch Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Track Your Spirits Delivery
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Enter your order number and registered phone or email below to check live packaging and dispatch status.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                placeholder="e.g. BW-98421"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Phone Number or Email (Optional)
              </label>
              <input
                type="text"
                value={phoneOrEmailInput}
                onChange={(e) => setPhoneOrEmailInput(e.target.value)}
                placeholder="e.g. 0712345678 or email"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#d4af37]/20"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Track Order</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Live Tracking Timeline Result */}
        {searchedOrder && (
          <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
            {/* Top Status Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-2xl font-bold text-white">
                    Order #{searchedOrder.orderNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                    {searchedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Placed on {formatDateTime(searchedOrder.createdAt)} · Fixed KSh 100 Express Delivery
                </p>
              </div>

              <div className="text-right sm:self-center">
                <span className="text-xs text-zinc-500 block">Total Paid</span>
                <span className="text-xl font-bold text-white tabular-nums">
                  {formatKES(searchedOrder.total)}
                </span>
              </div>
            </div>

            {/* Live Google Maps Rider GPS Tracking */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
                  <Bike className="w-4 h-4" />
                  <span>Live Google Maps GPS Satellite Tracking</span>
                </h3>
                <span className="text-xs text-emerald-400 font-medium">
                  {searchedOrder.status === 'out_for_delivery'
                    ? '⚡ Rider En Route (Live GPS Active)'
                    : '🛰️ Monitored Dispatch'}
                </span>
              </div>
              <GoogleMapDeliveryTracker
                destinationCoords={
                  searchedOrder.destinationCoords ||
                  searchedOrder.shippingAddress.coordinates ||
                  resolveCoordinatesForAddress(searchedOrder.shippingAddress.town, searchedOrder.shippingAddress.exactLocation)
                }
                destinationName={`${searchedOrder.shippingAddress.town}, ${searchedOrder.shippingAddress.county}`}
                riderLocation={searchedOrder.riderLocation}
                riderName={searchedOrder.assignedRiderName || 'Juma Boda (Fleet #04)'}
                riderPhone={searchedOrder.assignedRiderPhone || '+254700000004'}
                orderStatus={searchedOrder.status}
                orderNumber={searchedOrder.orderNumber}
              />
            </div>

            {/* 5-Step Visual Pipeline */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-6">
                Delivery Progression Timeline
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-6 sm:space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {stepsConfig.map((step, idx) => {
                  const currentOrderIdx = getStatusIndex(searchedOrder.status);
                  const isDone = idx <= currentOrderIdx;
                  const isCurrent = idx === currentOrderIdx;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-[#d4af37] text-black ring-4 ring-[#d4af37]/20 shadow-md shadow-[#d4af37]/30'
                            : 'bg-[#181922] text-zinc-600 border border-zinc-800'
                        }`}
                      >
                        {step.icon}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 bg-[#161821] border border-zinc-800/80 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className={`text-sm font-semibold ${isDone ? 'text-white' : 'text-zinc-400'}`}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              Active Status
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{step.description}</p>

                        {/* M-Pesa Receipt callout on paid step */}
                        {step.status === 'paid' && searchedOrder.mpesaDetails?.receiptNumber && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-300">
                            <span className="text-zinc-500">M-Pesa Receipt Code:</span>
                            <span className="font-mono font-bold text-[#d4af37]">
                              {searchedOrder.mpesaDetails.receiptNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Location & Recipient Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="bg-[#161821] border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Destination</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-medium text-white">{searchedOrder.shippingAddress.fullName}</p>
                  <p>{searchedOrder.shippingAddress.exactLocation}</p>
                  <p className="text-zinc-400">
                    {searchedOrder.shippingAddress.town}, {searchedOrder.shippingAddress.county} County
                  </p>
                  {searchedOrder.shippingAddress.buildingOrLandmark && (
                    <p className="text-[11px] text-zinc-500 italic">
                      Landmark: {searchedOrder.shippingAddress.buildingOrLandmark}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[#161821] border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact & Dispatch Support</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1">
                  <p>Customer Phone: <strong>{formatKenyanPhone(searchedOrder.phone)}</strong></p>
                  <p className="text-zinc-400">Dispatched from: BarKwetu Central Vault, Nairobi</p>
                  <p className="text-zinc-400">Support Hotline: +254 700 123 456</p>
                </div>
              </div>
            </div>

            {/* Items Summary in this Order */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                Spirits in this Order
              </h4>
              <div className="space-y-2">
                {searchedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#0d0e12] border border-zinc-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#161821] rounded p-1 flex items-center justify-center shrink-0">
                        <img src={item.image} alt={item.productName} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.productName}</p>
                        <p className="text-zinc-500 text-[11px]">{item.volume} · Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-zinc-200 tabular-nums">
                      {formatKES(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to Store button */}
            <div className="text-center pt-2">
              <button
                onClick={() => setActiveView('store')}
                className="py-3 px-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Spirits Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
