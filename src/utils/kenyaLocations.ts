// Standard Karatina Town & Nyeri County Delivery Locations and Coordinate Resolver

export interface ZoneLocation {
  name: string;
  county: string;
  lat: number;
  lng: number;
  estimatedMinutesFromHub: number;
}

export const STORE_HUB_LOCATION = {
  name: 'BarKwetu Reserve Hub (Karatina CBD)',
  address: 'Commercial Street, Opp. Karatina Open Air Market, Karatina Town, Nyeri County',
  lat: -0.4817,
  lng: 37.1265,
};

export const KARATINA_DELIVERY_ZONES: Record<string, ZoneLocation> = {
  'karatina': {
    name: 'Karatina CBD / Commercial Street',
    county: 'Nyeri',
    lat: -0.4817,
    lng: 37.1265,
    estimatedMinutesFromHub: 8,
  },
  'ragati': {
    name: 'Ragati / Railway / Market Road',
    county: 'Nyeri',
    lat: -0.4855,
    lng: 37.1290,
    estimatedMinutesFromHub: 10,
  },
  'blue-valley': {
    name: 'Blue Valley / Karatina Stadium',
    county: 'Nyeri',
    lat: -0.4780,
    lng: 37.1230,
    estimatedMinutesFromHub: 10,
  },
  'kairu': {
    name: 'Gwa-Kairu / Market Road',
    county: 'Nyeri',
    lat: -0.4795,
    lng: 37.1245,
    estimatedMinutesFromHub: 12,
  },
  'mathira': {
    name: 'Mathira / Giagatika',
    county: 'Nyeri',
    lat: -0.4550,
    lng: 37.0980,
    estimatedMinutesFromHub: 18,
  },
  'tumutumu': {
    name: 'Tumutumu / Jamii Hospital',
    county: 'Nyeri',
    lat: -0.4950,
    lng: 37.0920,
    estimatedMinutesFromHub: 20,
  },
  'jomo-kenyatta': {
    name: 'Jomo Kenyatta Road / State Lodge Rd',
    county: 'Nyeri',
    lat: -0.4720,
    lng: 37.1350,
    estimatedMinutesFromHub: 15,
  },
  'hiriga': {
    name: 'Hiriga / Ruthagati',
    county: 'Nyeri',
    lat: -0.4480,
    lng: 37.1520,
    estimatedMinutesFromHub: 22,
  },
  'kiahiti': {
    name: 'Kiahiti / Gikambo',
    county: 'Nyeri',
    lat: -0.4890,
    lng: 37.1420,
    estimatedMinutesFromHub: 15,
  },
  'mukurweini': {
    name: 'Mukurwe-ini Junction / Gakindu',
    county: 'Nyeri',
    lat: -0.4980,
    lng: 37.1180,
    estimatedMinutesFromHub: 25,
  },
  'nyeri-town': {
    name: 'Nyeri Town / Skuta',
    county: 'Nyeri',
    lat: -0.4200,
    lng: 36.9500,
    estimatedMinutesFromHub: 35,
  },
  'kerugoya': {
    name: 'Kerugoya / Sagana Junction',
    county: 'Kirinyaga',
    lat: -0.4989,
    lng: 37.2800,
    estimatedMinutesFromHub: 30,
  },
};

// Backwards-compatibility alias
export const NAIROBI_DELIVERY_ZONES = KARATINA_DELIVERY_ZONES;

/**
 * Resolve approximate coordinates from shipping address town/exact location in Karatina
 */
export function resolveCoordinatesForAddress(town: string, exactLocation = ''): { lat: number; lng: number } {
  const combined = `${town} ${exactLocation}`.toLowerCase();

  for (const [key, zone] of Object.entries(KARATINA_DELIVERY_ZONES)) {
    if (combined.includes(key) || key.includes(town.toLowerCase()) || town.toLowerCase().includes(key)) {
      // Add slight jitter for realism so addresses in same zone don't overlap completely
      const jitterLat = (Math.random() - 0.5) * 0.003;
      const jitterLng = (Math.random() - 0.5) * 0.003;
      return {
        lat: zone.lat + jitterLat,
        lng: zone.lng + jitterLng,
      };
    }
  }

  // Default to central Karatina CBD if unrecognized
  return {
    lat: STORE_HUB_LOCATION.lat + 0.002,
    lng: STORE_HUB_LOCATION.lng + 0.003,
  };
}

/**
 * Calculate distance in kilometers between two GPS points (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Interpolate intermediate points along a route for smooth rider tracking simulation
 */
export function interpolatePoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  fraction: number
): { lat: number; lng: number } {
  return {
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
  };
}
