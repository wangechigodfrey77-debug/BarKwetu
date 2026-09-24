import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { loadGoogleMaps, BARKWETU_MAP_DARK_THEME } from '../../services/googleMapsLoader';
import { STORE_HUB_LOCATION, calculateDistanceKm, interpolatePoints } from '../../utils/kenyaLocations';
import { Order, RiderLocation, OrderStatus } from '../../types';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldCheck,
  Clock,
  Package,
  Compass,
  RefreshCw,
  Power,
  ChevronRight,
} from 'lucide-react';

export const RiderAppView: React.FC = () => {
  const {
    orders,
    currentUser,
    updateOrderStatus,
    updateRiderGpsLocation,
    showToast,
    setActiveView,
  } = useStore();

  const [isBroadcastingGps, setIsBroadcastingGps] = useState(true);
  const [gpsMode, setGpsMode] = useState<'device' | 'simulator'>('simulator');
  const [currentCoords, setCurrentCoords] = useState<RiderLocation>({
    lat: STORE_HUB_LOCATION.lat,
    lng: STORE_HUB_LOCATION.lng,
    heading: 45,
    speed: 28,
    accuracy: 5,
    updatedAt: new Date().toISOString(),
    isLive: true,
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showAgeVerificationModal, setShowAgeVerificationModal] = useState(false);
  const [customerVerified18, setCustomerVerified18] = useState(false);
  const [idTypeSeen, setIdTypeSeen] = useState('national_id');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Active delivery orders
  const activeOrders = orders.filter(
    (o) => o.status === 'out_for_delivery' || o.status === 'preparing' || o.status === 'paid'
  );

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) ||
    activeOrders[0] ||
    orders[0];

  const destination = selectedOrder?.shippingAddress?.coordinates || {
    lat: -0.4817,
    lng: 37.1265,
  };

  // 1. Device Real GPS Tracking via Browser Geolocation API
  useEffect(() => {
    let watchId: number | null = null;

    if (isBroadcastingGps && gpsMode === 'device' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLoc: RiderLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 25,
            accuracy: Math.round(position.coords.accuracy),
            updatedAt: new Date().toISOString(),
            isLive: true,
          };
          setCurrentCoords(newLoc);
          if (selectedOrder) {
            updateRiderGpsLocation(selectedOrder.id, newLoc);
          }
        },
        (error) => {
          console.warn('Device GPS unavailable, switching to simulated GPS', error);
          setGpsMode('simulator');
          showToast('Device GPS permission denied or unavailable. Using High-Precision GPS simulation.', 'info');
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isBroadcastingGps, gpsMode, selectedOrder]);

  // 2. High-Precision Nairobi GPS Route Simulator
  useEffect(() => {
    if (isBroadcastingGps && gpsMode === 'simulator' && selectedOrder) {
      let stepFraction = 0.2;
      simIntervalRef.current = setInterval(() => {
        stepFraction += 0.05;
        if (stepFraction > 0.95) stepFraction = 0.2;

        const startPos = { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng };
        const nextPos = interpolatePoints(startPos, destination, stepFraction);

        const newLoc: RiderLocation = {
          lat: nextPos.lat,
          lng: nextPos.lng,
          heading: 65,
          speed: Math.floor(25 + Math.random() * 15),
          accuracy: 4,
          updatedAt: new Date().toISOString(),
          isLive: true,
        };

        setCurrentCoords(newLoc);
        updateRiderGpsLocation(selectedOrder.id, newLoc);
      }, 4000);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isBroadcastingGps, gpsMode, selectedOrder, destination]);

  // 3. Initialize Google Map on Rider Screen
  useEffect(() => {
    let isMounted = true;

    async function initRiderMap() {
      if (!mapContainerRef.current) return;

      const googleObj = await loadGoogleMaps();
      if (!googleObj || !isMounted) return;

      const map = new googleObj.maps.Map(mapContainerRef.current, {
        center: { lat: currentCoords.lat, lng: currentCoords.lng },
        zoom: 15,
        styles: BARKWETU_MAP_DARK_THEME,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Hub Marker
      new googleObj.maps.Marker({
        position: { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng },
        map,
        title: 'BarKwetu Hub',
        icon: {
          path: googleObj.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#d4af37',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Customer Marker
      new googleObj.maps.Marker({
        position: destination,
        map,
        title: selectedOrder?.shippingAddress.fullName || 'Customer',
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new googleObj.maps.Point(12, 22),
        },
      });

      // Rider Marker
      const riderMarker = new googleObj.maps.Marker({
        position: { lat: currentCoords.lat, lng: currentCoords.lng },
        map,
        title: 'You (BarKwetu Rider)',
        icon: {
          path: googleObj.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: currentCoords.heading || 0,
        },
      });
      riderMarkerRef.current = riderMarker;
    }

    initRiderMap();

    return () => {
      isMounted = false;
    };
  }, [selectedOrder]);

  // Update Rider Marker on map
  useEffect(() => {
    if (riderMarkerRef.current && window.google?.maps) {
      const pos = new window.google.maps.LatLng(currentCoords.lat, currentCoords.lng);
      riderMarkerRef.current.setPosition(pos);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(pos);
      }
    }
  }, [currentCoords]);

  // Status transition handlers
  const handleMarkOutForDelivery = (order: Order) => {
    updateOrderStatus(order.id, 'out_for_delivery');
    showToast(`Order ${order.orderNumber} is now OUT FOR DELIVERY. Live GPS sharing active.`, 'success');
  };

  const handleConfirmAgeAndComplete = () => {
    if (!customerVerified18) {
      showToast('Please confirm the customer has presented 18+ valid identification.', 'error');
      return;
    }
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'delivered');
      showToast(`Order ${selectedOrder.orderNumber} DELIVERED successfully! Age verified.`, 'success');
      setShowAgeVerificationModal(false);
      setCustomerVerified18(false);
    }
  };

  const remainingDist = selectedOrder
    ? calculateDistanceKm(currentCoords.lat, currentCoords.lng, destination.lat, destination.lng)
    : 0;

  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords.lat},${currentCoords.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 pt-4 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Rider Top Navigation & GPS Controls */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  BarKwetu Rider Dispatch
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Online
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Rider: <span className="text-neutral-200 font-medium">{currentUser?.fullName || 'Juma Express'}</span> · Bike: <span className="text-amber-400 font-mono">KMCE 482J</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* GPS Broadcast Toggle */}
            <button
              onClick={() => setIsBroadcastingGps(!isBroadcastingGps)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition border ${
                isBroadcastingGps
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <Radio size={16} className={isBroadcastingGps ? 'animate-pulse text-emerald-400' : ''} />
              <span>{isBroadcastingGps ? 'GPS Broadcast: ON' : 'GPS Broadcast: OFF'}</span>
            </button>

            {/* Switch Mode */}
            <button
              onClick={() => setGpsMode(gpsMode === 'device' ? 'simulator' : 'device')}
              className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition"
              title="Toggle between physical phone GPS and Nairobi high-precision simulation"
            >
              Mode: {gpsMode === 'device' ? '📱 Real GPS' : '🛰️ Sim GPS'}
            </button>
          </div>
        </div>

        {/* Live GPS Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">COORDINATES</span>
            <span className="font-mono text-neutral-200 font-medium">
              {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">CURRENT SPEED</span>
            <span className="font-bold text-emerald-400">{currentCoords.speed} km/h</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">ACCURACY</span>
            <span className="text-neutral-300">±{currentCoords.accuracy}m</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">FIRESTORE SYNC</span>
            <span className="text-emerald-400 font-medium">Active (Real-time)</span>
          </div>
        </div>

        {/* Active Order Navigation Card */}
        {selectedOrder ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Card Header */}
            <div className="p-5 bg-neutral-950/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    selectedOrder.status === 'out_for_delivery'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : selectedOrder.status === 'delivered'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Deliver to: {selectedOrder.shippingAddress.fullName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedOrder.shippingAddress.phone}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/50"
                >
                  <Phone size={14} />
                  <span>Call Customer</span>
                </a>
                <a
                  href={googleNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-950/50"
                >
                  <Navigation size={14} />
                  <span>Open Google Maps Navigation</span>
                </a>
              </div>
            </div>

            {/* Split Screen: Map + Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: Embedded Live Map */}
              <div className="lg:col-span-7 h-[300px] lg:h-auto min-h-[300px] relative bg-neutral-950 border-b lg:border-b-0 lg:border-r border-neutral-800">
                <div ref={mapContainerRef} className="w-full h-full" />
                <div className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Distance to Customer: <strong className="text-amber-400">{remainingDist} km</strong></span>
                </div>
              </div>

              {/* Right Column: Delivery Details & Actions */}
              <div className="lg:col-span-5 p-5 space-y-4 bg-neutral-900/50">
                {/* Delivery Address */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wide">
                        Drop-Off Location
                      </h5>
                      <p className="text-sm font-semibold text-neutral-200 mt-0.5">
                        {selectedOrder.shippingAddress.town}, {selectedOrder.shippingAddress.county}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {selectedOrder.shippingAddress.exactLocation}
                      </p>
                      {selectedOrder.shippingAddress.buildingOrLandmark && (
                        <p className="text-xs text-amber-300/90 italic mt-1">
                          Landmark: {selectedOrder.shippingAddress.buildingOrLandmark}
                        </p>
                      )}
                      {selectedOrder.shippingAddress.deliveryNotes && (
                        <div className="mt-2 p-2 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                          <strong>Note:</strong> {selectedOrder.shippingAddress.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package Contents */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={16} className="text-neutral-400" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wide">
                      Items in Thermal Pack ({selectedOrder.items.length})
                    </h5>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-neutral-300">
                        <span>{item.quantity}× {item.productName} ({item.volume})</span>
                        <span className="font-mono text-amber-400">KSh {(item.price * item.quantity).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 pt-2 border-t border-neutral-800 flex justify-between text-xs font-bold">
                    <span className="text-neutral-400">M-Pesa Payment Status:</span>
                    <span className="text-emerald-400">PAID IN FULL</span>
                  </div>
                </div>

                {/* Rider Action Progression */}
                <div className="pt-2 space-y-2">
                  {selectedOrder.status !== 'out_for_delivery' && selectedOrder.status !== 'delivered' && (
                    <button
                      onClick={() => handleMarkOutForDelivery(selectedOrder)}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
                    >
                      <Bike size={18} />
                      <span>Start Trip (Out for Delivery)</span>
                    </button>
                  )}

                  {selectedOrder.status === 'out_for_delivery' && (
                    <button
                      onClick={() => setShowAgeVerificationModal(true)}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 animate-pulse"
                    >
                      <CheckCircle2 size={18} />
                      <span>Arrived · Complete Delivery & Verify 18+ ID</span>
                    </button>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                      <ShieldCheck size={16} />
                      <span>Delivery Completed & 18+ Age Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl">
            <Bike size={48} className="mx-auto text-neutral-600 mb-3" />
            <h4 className="text-white font-bold text-base">No Active Deliveries Assigned</h4>
            <p className="text-neutral-400 text-xs mt-1">
              New orders will appear here as soon as dispatched from the Kilimani hub.
            </p>
          </div>
        )}

        {/* Other Active Deliveries in Queue */}
        {orders.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
              All Orders in Dispatch Queue ({orders.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedOrder?.id === ord.id
                      ? 'bg-neutral-900 border-amber-500/50'
                      : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">
                      {ord.userName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {ord.shippingAddress.town} · KSh {ord.total.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-neutral-500" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Mandatory 18+ Age Verification Modal on Handover */}
      {showAgeVerificationModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                18+
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Mandatory Age Verification Handover
                </h3>
                <p className="text-xs text-neutral-400">
                  Alcohol Control Act Kenya Compliance
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
              <p className="text-neutral-300">
                You are handing over alcohol to <strong className="text-white">{selectedOrder.shippingAddress.fullName}</strong>. You must inspect a physical valid ID document.
              </p>

              <div>
                <label className="text-neutral-400 block mb-1 text-[11px] font-semibold">
                  Identification Document Checked:
                </label>
                <select
                  value={idTypeSeen}
                  onChange={(e) => setIdTypeSeen(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs"
                >
                  <option value="national_id">Kenyan National ID Card</option>
                  <option value="passport">Valid International Passport</option>
                  <option value="driving_licence">Kenyan Driving Licence</option>
                  <option value="military_id">Official Service ID</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerVerified18}
                  onChange={(e) => setCustomerVerified18(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-700"
                />
                <span className="text-neutral-200 text-xs">
                  I confirm that the recipient is 18 years of age or older and matches the recipient credentials.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAgeVerificationModal(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAgeAndComplete}
                disabled={!customerVerified18}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/50"
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
