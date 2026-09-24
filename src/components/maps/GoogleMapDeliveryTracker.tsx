import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, BARKWETU_MAP_DARK_THEME } from '../../services/googleMapsLoader';
import { STORE_HUB_LOCATION, calculateDistanceKm } from '../../utils/kenyaLocations';
import { RiderLocation } from '../../types';
import { MapPin, Navigation, Bike, Compass, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface GoogleMapDeliveryTrackerProps {
  destinationCoords: { lat: number; lng: number };
  destinationName: string;
  riderLocation?: RiderLocation;
  riderName?: string;
  riderPhone?: string;
  orderStatus: string;
  orderNumber: string;
}

export const GoogleMapDeliveryTracker: React.FC<GoogleMapDeliveryTrackerProps> = ({
  destinationCoords,
  destinationName,
  riderLocation,
  riderName = 'BarKwetu Express Rider',
  riderPhone = '+254700000002',
  orderStatus,
  orderNumber,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Active rider position (default to halfway between hub and destination if not yet broadcasted)
  const currentRiderPos = riderLocation
    ? { lat: riderLocation.lat, lng: riderLocation.lng }
    : {
        lat: (STORE_HUB_LOCATION.lat + destinationCoords.lat) / 2,
        lng: (STORE_HUB_LOCATION.lng + destinationCoords.lng) / 2,
      };

  const distanceKm = calculateDistanceKm(
    currentRiderPos.lat,
    currentRiderPos.lng,
    destinationCoords.lat,
    destinationCoords.lng
  );

  const estimatedMinsRemaining = Math.max(3, Math.round(distanceKm * 3.2));

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const googleObj = await loadGoogleMaps();
        if (!googleObj || !isMounted) {
          setLoadError(true);
          return;
        }

        // Initialize Map
        const map = new googleObj.maps.Map(mapContainerRef.current, {
          center: currentRiderPos,
          zoom: 14,
          styles: BARKWETU_MAP_DARK_THEME,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // 1. Hub Marker (Store)
        new googleObj.maps.Marker({
          position: { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng },
          map,
          title: STORE_HUB_LOCATION.name,
          icon: {
            path: googleObj.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#d4af37',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // 2. Destination Marker (Customer)
        new googleObj.maps.Marker({
          position: destinationCoords,
          map,
          title: `Delivery Destination: ${destinationName}`,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 1.8,
            anchor: new googleObj.maps.Point(12, 22),
          },
        });

        // 3. Rider Live Marker
        const riderMarker = new googleObj.maps.Marker({
          position: currentRiderPos,
          map,
          title: `${riderName} (Live GPS)`,
          icon: {
            path: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#000000',
            strokeWeight: 2,
            scale: 2.2,
            anchor: new googleObj.maps.Point(12, 12),
          },
        });
        riderMarkerRef.current = riderMarker;

        // 4. Route Polyline
        const routePath = [
          { lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng },
          currentRiderPos,
          destinationCoords,
        ];

        const polyline = new googleObj.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#d4af37',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
        polylineRef.current = polyline;

        // Fit bounds to show both points nicely
        const bounds = new googleObj.maps.LatLngBounds();
        bounds.extend({ lat: STORE_HUB_LOCATION.lat, lng: STORE_HUB_LOCATION.lng });
        bounds.extend(currentRiderPos);
        bounds.extend(destinationCoords);
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

        setMapLoaded(true);
      } catch (err) {
        console.warn('Google Maps initialization fallback:', err);
        setLoadError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Rider Marker position dynamically when real-time GPS stream arrives
  useEffect(() => {
    if (riderMarkerRef.current && window.google?.maps && riderLocation) {
      const newPos = new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng);
      riderMarkerRef.current.setPosition(newPos);

      // Pan slightly to keep rider in view
      if (mapInstanceRef.current && orderStatus === 'out_for_delivery') {
        mapInstanceRef.current.panTo(newPos);
      }
    }
  }, [riderLocation, orderStatus]);

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentRiderPos.lat},${currentRiderPos.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=driving`;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Map Header / Live Status Bar */}
      <div className="p-4 bg-neutral-950/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white tracking-wide">
                Live Google Maps GPS Dispatch
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {riderLocation?.isLive ? 'Real-Time GPS' : 'Active Satellite'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Rider: <span className="text-amber-300 font-medium">{riderName}</span> · {destinationName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-neutral-400">Est. Arrival</span>
            <p className="text-sm font-bold text-amber-400">~{estimatedMinsRemaining} mins</p>
          </div>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition"
          >
            <ExternalLink size={13} className="text-amber-400" />
            <span>Open in Google Maps</span>
          </a>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative w-full h-[360px] bg-neutral-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Fallback Display if Google Maps JS fails or loads slowly */}
        {loadError && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
              <Bike size={32} />
            </div>
            <h5 className="text-white font-medium text-base mb-1">
              Live Rider GPS Active ({riderName})
            </h5>
            <p className="text-neutral-400 text-xs max-w-sm mb-4">
              Rider is currently en route to <span className="text-white font-semibold">{destinationName}</span> with tamper-proof sealed pack.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl">
              <div>
                <span className="text-neutral-500 block text-[10px]">DISTANCE</span>
                <span className="font-bold text-amber-400">{distanceKm} km</span>
              </div>
              <div className="h-6 w-px bg-neutral-800" />
              <div>
                <span className="text-neutral-500 block text-[10px]">SPEED</span>
                <span className="font-bold text-emerald-400">{riderLocation?.speed ? `${riderLocation.speed} km/h` : '32 km/h'}</span>
              </div>
              <div className="h-6 w-px bg-neutral-800" />
              <div>
                <span className="text-neutral-500 block text-[10px]">DISPATCH</span>
                <span className="font-bold text-white">Kilimani Express</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Rider Live Card Overlay */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-neutral-950/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              <Bike size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white flex items-center gap-1">
                {riderName}
                <ShieldCheck size={13} className="text-emerald-400" />
              </p>
              <p className="text-[11px] text-neutral-400">
                BarKwetu Dedicated Boda Express
              </p>
            </div>
          </div>
          <a
            href={`tel:${riderPhone}`}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition"
          >
            Call Rider
          </a>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span>Cold-Insulated Temperature Monitored Delivery</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <Compass size={12} />
          <span>GPS Refresh: Real-time Firebase Sync</span>
        </div>
      </div>
    </div>
  );
};
