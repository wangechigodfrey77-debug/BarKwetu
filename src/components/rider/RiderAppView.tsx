import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { loadGoogleMaps, BARKWETU_MAP_DARK_THEME } from '../../services/googleMapsLoader';
import { STORE_HUB_LOCATION, calculateDistanceKm, interpolatePoints } from '../../utils/kenyaLocations';
import { Order, RiderLocation } from '../../types';
import { formatKES, formatKenyanPhone, formatDateTime } from '../../utils/formatters';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldCheck,
  Clock,
  Package,
  Compass,
  Power,
  ChevronRight,
  Lock,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  LogOut,
  ShoppingBag,
} from 'lucide-react';

export const RiderAppView: React.FC = () => {
  const {
    orders,
    currentUser,
    loginWithPassword,
    logout,
    changePassword,
    claimOrderAsRider,
    updateOrderStatus,
    updateRiderGpsLocation,
    showToast,
    setActiveView,
  } = useStore();

  // Authentication State for Rider View Gate
  const [loginIdentifier, setLoginIdentifier] = useState('rider');
  const [loginPassword, setLoginPassword] = useState('rider123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Account & Change Password Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showPassChangeToggles, setShowPassChangeToggles] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Tab & Order View State
  const [riderActiveTab, setRiderActiveTab] = useState<'available' | 'active' | 'completed'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // GPS and Navigation States
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

  // Age Verification Handover Modal
  const [showAgeVerificationModal, setShowAgeVerificationModal] = useState(false);
  const [customerVerified18, setCustomerVerified18] = useState(false);
  const [idTypeSeen, setIdTypeSeen] = useState('national_id');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);
  const simIntervalRef = useRef<any>(null);

  const isRiderAuthorized = currentUser && currentUser.role === 'rider';

  // Categorize Orders
  // 1. Available to Pick (Paid or preparing or unassigned out_for_delivery)
  const availableOrders = orders.filter(
    (o) =>
      (o.status === 'paid' || o.status === 'preparing') &&
      (!o.assignedRiderId || o.assignedRiderId === currentUser?.id)
  );

  // 2. Active Deliveries assigned to this rider
  const myActiveOrders = orders.filter(
    (o) =>
      o.assignedRiderId === currentUser?.id &&
      (o.status === 'out_for_delivery' || o.status === 'preparing' || o.status === 'paid')
  );

  // 3. Completed Deliveries by this rider
  const myCompletedOrders = orders.filter(
    (o) => o.assignedRiderId === currentUser?.id && o.status === 'delivered'
  );

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) ||
    myActiveOrders[0] ||
    availableOrders[0] ||
    orders[0];

  const destination = selectedOrder?.shippingAddress?.coordinates || {
    lat: -0.4817,
    lng: 37.1265,
  };

  // Switch default tab if no active orders
  useEffect(() => {
    if (myActiveOrders.length === 0 && availableOrders.length > 0 && riderActiveTab === 'active') {
      setRiderActiveTab('available');
    }
  }, [myActiveOrders.length, availableOrders.length]);

  // Handle Rider Login
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const result = await loginWithPassword(loginIdentifier, loginPassword);
      if (!result.success) {
        setLoginError(result.message || 'Invalid credentials. Please verify your rider password.');
      } else {
        showToast('Authorized Rider session active.', 'success');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate rider.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (newPassInput !== confirmPassInput) {
      setPasswordChangeStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassInput.length < 4) {
      setPasswordChangeStatus({ type: 'error', message: 'Password must be at least 4 characters.' });
      return;
    }

    if (!currentUser) return;

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentUser.id, currentPassInput, newPassInput);
      if (res.success) {
        setPasswordChangeStatus({ type: 'success', message: 'Password updated successfully! Keep it secure.' });
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
      } else {
        setPasswordChangeStatus({ type: 'error', message: res.message || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordChangeStatus({ type: 'error', message: err.message || 'Error updating password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  // Handle Claiming / Picking Order
  const handlePickOrder = async (order: Order) => {
    if (!currentUser) return;
    const res = await claimOrderAsRider(order.id, currentUser);
    if (res.success) {
      setSelectedOrderId(order.id);
      setRiderActiveTab('active');
    }
  };

  // 1. Device Real GPS Tracking via Browser Geolocation API
  useEffect(() => {
    let watchId: number | null = null;

    if (isRiderAuthorized && isBroadcastingGps && gpsMode === 'device' && navigator.geolocation) {
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
          showToast('Device GPS unavailable. Using Karatina precision route simulator.', 'info');
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isRiderAuthorized, isBroadcastingGps, gpsMode, selectedOrder]);

  // 2. High-Precision Karatina GPS Route Simulator
  useEffect(() => {
    if (isRiderAuthorized && isBroadcastingGps && gpsMode === 'simulator' && selectedOrder) {
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
  }, [isRiderAuthorized, isBroadcastingGps, gpsMode, selectedOrder, destination]);

  // 3. Initialize Google Map on Rider Screen
  useEffect(() => {
    if (!isRiderAuthorized || !mapContainerRef.current) return;
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
        title: 'BarKwetu Karatina Hub',
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
        title: selectedOrder?.shippingAddress?.fullName || 'Customer',
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
        title: `Rider ${currentUser?.fullName || ''}`,
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
  }, [isRiderAuthorized, selectedOrder]);

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
    showToast(`Order ${order.orderNumber} is now OUT FOR DELIVERY in Karatina. Live GPS active.`, 'success');
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

  // ================= RIDER PASSWORD ACCESS GATE =================
  if (!isRiderAuthorized) {
    return (
      <div className="min-h-screen bg-[#090a0d] flex items-center justify-center p-4 sm:p-6 text-zinc-100">
        <div className="w-full max-w-md bg-[#121318] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Top Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#d4af37] to-emerald-500" />

          {/* Gate Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
              <Bike className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
              BarKwetu Rider Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Karatina Town & Mathira Express Boda Dispatch
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-[#0d0e12] border border-zinc-800/80 rounded-2xl p-3.5 text-xs text-zinc-400 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-zinc-200">Restricted Access:</strong> Only registered & authorized Karatina dispatch riders can access orders and live telemetry.
            </p>
          </div>

          {/* Login Error Banner */}
          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Rider Login Form */}
          <form onSubmit={handleRiderLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">
                Rider Username / Phone / Email
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="rider or 0700000004"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-zinc-300 font-semibold">
                  Rider Access Password
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Default: rider123</span>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter rider password"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 pr-10 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLogin ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>Unlock Dispatch Console</span>
            </button>
          </form>

          {/* Quick Demo Helper & Back Navigation */}
          <div className="space-y-3 pt-2 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={() => {
                setLoginIdentifier('rider');
                setLoginPassword('rider123');
              }}
              className="text-xs text-[#d4af37] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Default Rider (rider / rider123)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('store')}
              className="text-xs text-zinc-400 hover:text-zinc-200 block mx-auto cursor-pointer transition-colors"
            >
              ← Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= AUTHORIZED RIDER VIEW =================
  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 pb-20 pt-4 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Rider Top Status Banner & Header */}
        <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/50">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  BarKwetu Rider Dispatch
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rider: <strong className="text-zinc-200">{currentUser.fullName}</strong> · Bike:{' '}
                <span className="text-[#d4af37] font-mono font-bold">
                  {currentUser.bikeRegistration || 'KMCE 482J'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Account & Password Settings Button */}
            <button
              onClick={() => {
                setIsAccountModalOpen(true);
                setPasswordChangeStatus(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-semibold transition cursor-pointer"
              title="Change Password & View Rider Profile"
            >
              <Key className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Change Password</span>
            </button>

            {/* GPS Broadcast Toggle */}
            <button
              onClick={() => setIsBroadcastingGps(!isBroadcastingGps)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition border cursor-pointer ${
                isBroadcastingGps
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/50'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isBroadcastingGps ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{isBroadcastingGps ? 'GPS: ON' : 'GPS: OFF'}</span>
            </button>

            {/* GPS Simulation Mode Toggle */}
            <button
              onClick={() => setGpsMode(gpsMode === 'device' ? 'simulator' : 'device')}
              className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Toggle between physical phone GPS and Karatina simulation"
            >
              {gpsMode === 'device' ? '📱 Real GPS' : '🛰️ Sim GPS'}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live GPS Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121318]/60 border border-zinc-800/80 rounded-2xl p-3.5 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              COORDINATES (KARATINA)
            </span>
            <span className="font-mono text-zinc-200 font-medium">
              {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              CURRENT SPEED
            </span>
            <span className="font-bold text-emerald-400 font-mono">{currentCoords.speed} km/h</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              GPS ACCURACY
            </span>
            <span className="text-zinc-300 font-mono">±{currentCoords.accuracy}m</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              FIRESTORE CLOUD SYNC
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live & Broadcasted
            </span>
          </div>
        </div>

        {/* Dispatch Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-2">
          <button
            onClick={() => setRiderActiveTab('available')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              riderActiveTab === 'available'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Available for Pickup</span>
            <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-bold">
              {availableOrders.length}
            </span>
          </button>

          <button
            onClick={() => setRiderActiveTab('active')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              riderActiveTab === 'active'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>My Active Dispatches</span>
            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              {myActiveOrders.length}
            </span>
          </button>

          <button
            onClick={() => setRiderActiveTab('completed')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              riderActiveTab === 'completed'
                ? 'border-zinc-300 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Today</span>
            <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-bold">
              {myCompletedOrders.length}
            </span>
          </button>
        </div>

        {/* TAB 1: AVAILABLE FOR PICKUP */}
        {riderActiveTab === 'available' && (
          <div className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="p-12 text-center bg-[#121318] border border-zinc-800 rounded-3xl space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto text-zinc-600" />
                <h4 className="text-white font-bold text-base">No Orders Awaiting Pickup</h4>
                <p className="text-zinc-400 text-xs max-w-md mx-auto">
                  All current customer orders in Karatina Town have been claimed or delivered. New orders will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#121318] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-xl space-y-4 transition-all"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <p className="text-xs text-zinc-400 mt-1">
                          Placed: {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-white font-mono">
                          {formatKES(order.total)}
                        </span>
                        <span className="block text-[10px] text-emerald-400 uppercase font-semibold">
                          M-Pesa Paid
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-zinc-200">
                            {order.shippingAddress.town}, {order.shippingAddress.county}
                          </p>
                          <p className="text-zinc-400 text-[11px]">
                            {order.shippingAddress.exactLocation}
                          </p>
                          {order.shippingAddress.buildingOrLandmark && (
                            <p className="text-[#d4af37] text-[11px] italic">
                              Landmark: {order.shippingAddress.buildingOrLandmark}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 text-zinc-300">
                        <Package className="w-4 h-4 text-zinc-500" />
                        <span>{order.items.length} item(s): {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                      </div>
                    </div>

                    {/* Authorized Pick / Claim Button */}
                    <button
                      onClick={() => handlePickOrder(order)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Pick & Accept This Order</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ACTIVE DISPATCHES & LIVE NAVIGATION */}
        {riderActiveTab === 'active' && (
          <div className="space-y-6">
            {selectedOrder ? (
              <div className="bg-[#121318] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Active Order Banner Header */}
                <div className="p-5 bg-[#0e0f14] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 font-mono">
                        {selectedOrder.orderNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          selectedOrder.status === 'out_for_delivery'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : selectedOrder.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
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
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer</span>
                    </a>
                    <a
                      href={googleNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#d4af37] hover:brightness-110 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-amber-950/50"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps Turn-by-Turn</span>
                    </a>
                  </div>
                </div>

                {/* Split Screen: Map + Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left Column: Embedded Live Map */}
                  <div className="lg:col-span-7 h-[320px] lg:h-auto min-h-[320px] relative bg-[#090a0d] border-b lg:border-b-0 lg:border-r border-zinc-800">
                    <div ref={mapContainerRef} className="w-full h-full" />
                    <div className="absolute top-3 left-3 bg-[#090a0d]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>
                        Distance to Destination:{' '}
                        <strong className="text-[#d4af37]">{remainingDist} km</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Delivery Details & Actions */}
                  <div className="lg:col-span-5 p-5 space-y-4 bg-[#121318]/50">
                    {/* Delivery Address */}
                    <div className="p-3.5 rounded-2xl bg-[#090a0d] border border-zinc-800 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Karatina Drop-Off Location
                          </h5>
                          <p className="text-sm font-semibold text-zinc-100 mt-0.5">
                            {selectedOrder.shippingAddress.town}, {selectedOrder.shippingAddress.county}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {selectedOrder.shippingAddress.exactLocation}
                          </p>
                          {selectedOrder.shippingAddress.buildingOrLandmark && (
                            <p className="text-xs text-[#d4af37]/90 italic mt-1">
                              Landmark: {selectedOrder.shippingAddress.buildingOrLandmark}
                            </p>
                          )}
                          {selectedOrder.shippingAddress.deliveryNotes && (
                            <div className="mt-2 p-2 rounded-xl bg-[#121318] border border-zinc-800 text-[11px] text-zinc-300">
                              <strong>Note:</strong> {selectedOrder.shippingAddress.deliveryNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thermal Pack Contents */}
                    <div className="p-3.5 rounded-2xl bg-[#090a0d] border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-zinc-400" />
                        <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Items in Thermal Pack ({selectedOrder.items.length})
                        </h5>
                      </div>
                      <ul className="space-y-1.5 text-xs max-h-36 overflow-y-auto pr-1">
                        {selectedOrder.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-zinc-300">
                            <span>
                              {item.quantity}× {item.productName} ({item.volume})
                            </span>
                            <span className="font-mono text-[#d4af37]">
                              {formatKES(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2.5 pt-2 border-t border-zinc-800 flex justify-between text-xs font-bold">
                        <span className="text-zinc-400">M-Pesa Payment Status:</span>
                        <span className="text-emerald-400">PAID IN FULL</span>
                      </div>
                    </div>

                    {/* Rider Action Progression */}
                    <div className="pt-2 space-y-2">
                      {selectedOrder.status !== 'out_for_delivery' && selectedOrder.status !== 'delivered' && (
                        <button
                          onClick={() => handleMarkOutForDelivery(selectedOrder)}
                          className="w-full py-3 px-4 bg-[#d4af37] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Start Trip (Out for Delivery)</span>
                        </button>
                      )}

                      {selectedOrder.status === 'out_for_delivery' && (
                        <button
                          onClick={() => setShowAgeVerificationModal(true)}
                          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 animate-pulse cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Arrived · Complete Delivery & Verify 18+ ID</span>
                        </button>
                      )}

                      {selectedOrder.status === 'delivered' && (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Delivery Completed & 18+ Age Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#121318] border border-zinc-800 rounded-3xl space-y-3">
                <Bike className="w-12 h-12 mx-auto text-zinc-600" />
                <h4 className="text-white font-bold text-base">No Active Trip Selected</h4>
                <p className="text-zinc-400 text-xs">
                  Pick an available order from the queue above to start live GPS navigation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES */}
        {riderActiveTab === 'completed' && (
          <div className="space-y-4">
            {myCompletedOrders.length === 0 ? (
              <div className="p-12 text-center bg-[#121318] border border-zinc-800 rounded-3xl space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-zinc-600" />
                <h4 className="text-white font-bold text-base">No Completed Deliveries Yet</h4>
                <p className="text-zinc-400 text-xs">
                  Completed orders delivered by you will show up here along with 18+ ID verification logs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCompletedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#121318] border border-zinc-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        Delivered
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-white">{ord.shippingAddress.fullName}</p>
                      <p className="text-zinc-400">{ord.shippingAddress.town}, {ord.shippingAddress.county}</p>
                      <p className="text-zinc-500 text-[11px]">Delivered: {formatDateTime(ord.updatedAt)}</p>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs">
                      <span className="text-zinc-400">Total Paid:</span>
                      <span className="font-mono font-bold text-[#d4af37]">{formatKES(ord.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Rider Account & Change Password Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Rider Account & Security
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Change Password & Profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rider Credentials Summary */}
            <div className="bg-[#090a0d] border border-zinc-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Rider Name:</span>
                <span className="text-white font-semibold">{currentUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Login Username:</span>
                <span className="text-zinc-300 font-mono">{currentUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Motorbike Plate:</span>
                <span className="text-[#d4af37] font-mono font-bold">{currentUser.bikeRegistration || 'KMCE 482J'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Phone:</span>
                <span className="text-zinc-300">{formatKenyanPhone(currentUser.phone || '+254700000004')}</span>
              </div>
            </div>

            {/* Status Message */}
            {passwordChangeStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordChangeStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {passwordChangeStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordChangeStatus.message}</span>
              </div>
            )}

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Current Password
                </label>
                <input
                  type={showPassChangeToggles ? 'text' : 'password'}
                  required
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Enter current password (default: rider123)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  New Password
                </label>
                <input
                  type={showPassChangeToggles ? 'text' : 'password'}
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassChangeToggles ? 'text' : 'password'}
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassChangeToggles(!showPassChangeToggles)}
                  className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {showPassChangeToggles ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassChangeToggles ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex-1 py-2.5 bg-[#d4af37] hover:brightness-110 text-black font-bold rounded-xl transition shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory 18+ Age Verification Modal on Handover */}
      {showAgeVerificationModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-lg">
                18+
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Mandatory Age Verification Handover
                </h3>
                <p className="text-xs text-zinc-400">
                  Alcohol Control Act Kenya Compliance
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#090a0d] border border-zinc-800 space-y-3 text-xs">
              <p className="text-zinc-300">
                You are delivering alcohol to <strong className="text-white">{selectedOrder.shippingAddress.fullName}</strong> in Karatina. You must inspect a physical valid ID document.
              </p>

              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-semibold">
                  Identification Document Checked:
                </label>
                <select
                  value={idTypeSeen}
                  onChange={(e) => setIdTypeSeen(e.target.value)}
                  className="w-full bg-[#121318] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
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
                  className="mt-0.5 rounded text-[#d4af37] focus:ring-[#d4af37] bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-200 text-xs">
                  I confirm that the recipient is 18 years of age or older and matches the delivery recipient credentials.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAgeVerificationModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAgeAndComplete}
                disabled={!customerVerified18}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/50 cursor-pointer"
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
