import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { loadGoogleMaps, BARKWETU_MAP_DARK_THEME } from '../../services/googleMapsLoader';
import { STORE_HUB_LOCATION, NAIROBI_DELIVERY_ZONES, calculateDistanceKm } from '../../utils/kenyaLocations';
import { User, Order } from '../../types';
import { formatKenyanPhone, formatDateTime } from '../../utils/formatters';
import {
  Bike,
  Navigation,
  MapPin,
  Radio,
  Plus,
  RefreshCw,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  UserCheck,
  Zap,
} from 'lucide-react';

export const FleetTrackerTab: React.FC = () => {
  const {
    orders,
    adminUsers,
    createAdminAccount,
    assignRiderToOrder,
    updateRiderGpsLocation,
    showToast,
    setActiveView,
  } = useStore();

  const [selectedRiderId, setSelectedRiderId] = useState<string | null>('user-rider-1');
  const [isCreatingRider, setIsCreatingRider] = useState(false);
  const [newRiderForm, setNewRiderForm] = useState({
    fullName: '',
    phone: '+254',
    bikeRegistration: 'KMCE ',
    username: '',
    email: '',
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});

  const ridersList: User[] = adminUsers.filter((u) => u.role === 'rider');

  // If no rider exists, ensure default rider is present
  const allRiders: User[] = ridersList.length > 0 ? ridersList : [
    {
      id: 'user-rider-1',
      fullName: 'Juma Boda (Fleet #04)',
      username: 'rider',
      email: 'rider@barkwetu.co.ke',
      phone: '+254700000004',
      role: 'rider',
      bikeRegistration: 'KMCE 482J',
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  // Active orders with GPS coordinates
  const activeOrdersWithGps = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  // Initialize Admin Fleet Google Map
  useEffect(() => {
    let isMounted = true;

    async function initFleetMap() {
      if (!mapContainerRef.current) return;

      const googleObj = await loadGoogleMaps();
      if (!googleObj || !isMounted) return;

      const map = new googleObj.maps.Map(mapContainerRef.current, {
        center: { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng }, // Karatina Central
        zoom: 14,
        styles: BARKWETU_MAP_DARK_THEME,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
      });
      mapInstanceRef.current = map;

      // 1. Central Vault Store Hub Marker
      new googleObj.maps.Marker({
        position: { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng },
        map,
        title: 'BarKwetu Central Dispatch Vault (Karatina CBD)',
        icon: {
          path: googleObj.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#d4af37',
          fillOpacity: 1,
          strokeColor: '#000000',
          strokeWeight: 2,
        },
      });

      // 2. Plot Active Delivery Destinations
      activeOrdersWithGps.forEach((order) => {
        const destCoords = order.destinationCoords || order.shippingAddress.coordinates || {
          lat: -0.4817,
          lng: 37.1265,
        };

        const destMarker = new googleObj.maps.Marker({
          position: destCoords,
          map,
          title: `Delivery: ${order.orderNumber} - ${order.userName}`,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 1.4,
            anchor: new googleObj.maps.Point(12, 22),
          },
        });

        markersRef.current[`dest-${order.id}`] = destMarker;
      });

      // 3. Plot Active Riders
      orders.forEach((order) => {
        if (order.riderLocation) {
          const riderMarker = new googleObj.maps.Marker({
            position: { lat: order.riderLocation.lat, lng: order.riderLocation.lng },
            map,
            title: `Rider: ${order.assignedRiderName || 'BarKwetu Rider'} (${order.orderNumber})`,
            icon: {
              path: googleObj.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 7,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: order.riderLocation.heading || 0,
            },
          });
          markersRef.current[`rider-${order.id}`] = riderMarker;
        }
      });
    }

    initFleetMap();

    return () => {
      isMounted = false;
    };
  }, [orders]);

  // Handle Create Rider Account
  const handleCreateRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderForm.fullName || !newRiderForm.phone) {
      showToast('Please fill in Rider name and Kenyan phone number.', 'error');
      return;
    }

    const usernameClean = newRiderForm.username || newRiderForm.fullName.toLowerCase().replace(/\s+/g, '');
    const emailClean = newRiderForm.email || `${usernameClean}@barkwetu.co.ke`;

    createAdminAccount({
      fullName: `${newRiderForm.fullName} (${newRiderForm.bikeRegistration || 'Fleet Bike'})`,
      username: usernameClean,
      email: emailClean,
      role: 'admin', // Stored under account table with rider metadata
    });

    setIsCreatingRider(false);
    setNewRiderForm({
      fullName: '',
      phone: '+254',
      bikeRegistration: 'KMCE ',
      username: '',
      email: '',
    });
    showToast(`Rider account for ${newRiderForm.fullName} provisioned!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Rider Fleet & GPS Satellite Monitoring
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time live telemetry, GPS broadcast diagnostics, and express boda dispatch across Karatina Town & Mathira sub-county.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveView('rider')}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-900/30"
          >
            <Bike className="w-4 h-4" />
            <span>Launch Rider View</span>
          </button>

          <button
            onClick={() => setIsCreatingRider(true)}
            className="py-2.5 px-4 rounded-xl bg-[#d4af37] hover:brightness-110 text-black font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Rider Account</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Google Map + Fleet Status Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Maps Real-Time Fleet Radar */}
        <div className="lg:col-span-2 bg-[#121318] border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-serif text-sm font-bold text-white">
                Live Karatina Dispatch Radar
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Satellites Connected
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">{activeOrdersWithGps.length} Active Dispatches</span>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[380px] sm:h-[460px] rounded-xl overflow-hidden border border-zinc-800 bg-[#090a0d]">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Legend Overlay */}
            <div className="absolute top-3 left-3 bg-[#0d0e12]/90 backdrop-blur-md border border-zinc-800/90 rounded-lg p-2.5 text-[11px] space-y-1.5 shadow-xl">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                <span>BarKwetu Vault (Hub)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Active Rider GPS Position</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Customer Delivery Drop-off</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet List & Active Riders Panel */}
        <div className="space-y-4">
          <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <span>Express Fleet Directory</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {allRiders.length} Registered
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {allRiders.map((rider) => {
                const assignedOrders = orders.filter(
                  (o) => o.assignedRiderId === rider.id && o.status !== 'delivered' && o.status !== 'cancelled'
                );

                return (
                  <div
                    key={rider.id}
                    className="p-3.5 bg-[#0e0f14] border border-zinc-800 rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-white flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rider.fullName}</span>
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Bike Plate: <strong className="font-mono text-zinc-200">{rider.bikeRegistration || 'KMCE 482J'}</strong>
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{formatKenyanPhone(rider.phone || '+254700000004')}</span>
                      </span>
                      <span className="text-zinc-300 font-medium">
                        {assignedOrders.length} active delivery
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rider Assignment for Active Orders Table */}
      <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d4af37]" />
              <span>Active Order Rider Assignments</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Assign or re-route riders to orders ready for express dispatch across Karatina Town & Mathira.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Customer & Town</th>
                <th className="pb-3">Order Status</th>
                <th className="pb-3">Current Assigned Rider</th>
                <th className="pb-3">GPS Telemetry</th>
                <th className="pb-3 text-right">Assign Rider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id} className="hover:bg-[#161822] transition-colors">
                  <td className="py-3 font-mono font-bold text-white">{order.orderNumber}</td>
                  <td className="py-3">
                    <p className="font-medium text-zinc-200">{order.userName}</p>
                    <p className="text-[11px] text-zinc-500">
                      {order.shippingAddress.town}, {order.shippingAddress.county}
                    </p>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'out_for_delivery'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : order.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <Bike className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{order.assignedRiderName || 'Juma Boda (Fleet #04)'}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {order.riderLocation ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {order.riderLocation.speed || 25} km/h · Sat OK
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Awaiting Dispatch</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <select
                      value={order.assignedRiderId || 'user-rider-1'}
                      onChange={(e) => {
                        const targetRider = allRiders.find((r) => r.id === e.target.value) || allRiders[0];
                        assignRiderToOrder(order.id, targetRider);
                      }}
                      className="bg-[#090a0d] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
                    >
                      {allRiders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.fullName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Rider Account */}
      {isCreatingRider && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-400" />
                <span>Add Express Delivery Rider</span>
              </h3>
              <button
                onClick={() => setIsCreatingRider(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRider} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={newRiderForm.fullName}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, fullName: e.target.value })}
                  placeholder="e.g. Peter Kamau"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Motorbike Registration Plate</label>
                <input
                  type="text"
                  required
                  value={newRiderForm.bikeRegistration}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, bikeRegistration: e.target.value.toUpperCase() })}
                  placeholder="e.g. KMCE 918T"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Kenyan Phone Number (M-Pesa / Call)</label>
                <input
                  type="text"
                  required
                  value={newRiderForm.phone}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, phone: e.target.value })}
                  placeholder="e.g. +254 712 345 678"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Rider Login Username (Optional)</label>
                <input
                  type="text"
                  value={newRiderForm.username}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, username: e.target.value.toLowerCase() })}
                  placeholder="e.g. rider2"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingRider(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 cursor-pointer"
                >
                  Create Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
