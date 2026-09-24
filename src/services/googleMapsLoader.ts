import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let googleMapsPromise: Promise<typeof google | null> | null = null;

export const getGoogleMapsApiKey = (): string => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDcaZzHswfGeNiamsbjGnw__gd070WU638';
};

export const loadGoogleMaps = async (): Promise<typeof google | null> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY is not set.');
    return null;
  }

  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return (window as any).google;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = (async () => {
    try {
      if (!loaderInstance) {
        loaderInstance = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry', 'marker'],
        });
      }

      await (loaderInstance as any).load();
      return (window as any).google || null;
    } catch (error) {
      console.warn('Failed to load Google Maps JS API:', error);
      return null;
    }
  })();

  return googleMapsPromise;
};

// Luxury BarKwetu Dark Theme for Google Maps
export const BARKWETU_MAP_DARK_THEME: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#161616' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#161616' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d4af37' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4af37' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e241e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#262626' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a0a0a0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3d3420' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d4af37' }, { weight: 0.5 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3e5ab' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4af37' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d1117' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d1117' }],
  },
];
