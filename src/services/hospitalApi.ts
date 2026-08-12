// Free Real-Time Hospital API — OpenStreetMap Overpass API (No API keys required)
import * as Location from 'expo-location';

export interface HospitalLocationInfo {
  id: string;
  name: string;
  type: 'PHC' | 'Government Hospital' | 'Maternity Center' | 'Emergency Hub';
  address: string;
  phone: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  hasCEmONC: boolean;
  isOpen24x7: boolean;
}

// Fallback dataset for instant load or offline emergency mode
const FALLBACK_HOSPITALS: HospitalLocationInfo[] = [
  {
    id: 'h_1',
    name: 'Government Primary Health Centre (PHC) - Sholinganallur',
    type: 'PHC',
    address: 'Old Mahabalipuram Rd, Sholinganallur, Chennai, TN',
    phone: '044-24501234',
    distanceKm: 1.8,
    latitude: 12.901,
    longitude: 80.227,
    hasCEmONC: false,
    isOpen24x7: true,
  },
  {
    id: 'h_2',
    name: 'Kasturba Gandhi Hospital for Women & Children (Goschen)',
    type: 'Government Hospital',
    address: 'Triplicane High Rd, Triplicane, Chennai, TN',
    phone: '044-28441011',
    distanceKm: 12.4,
    latitude: 13.060,
    longitude: 80.276,
    hasCEmONC: true,
    isOpen24x7: true,
  },
  {
    id: 'h_3',
    name: 'Government ISO KGM Hospital (Royapettah Maternity)',
    type: 'Emergency Hub',
    address: 'Westcott Rd, Royapettah, Chennai, TN',
    phone: '044-28114001',
    distanceKm: 10.5,
    latitude: 13.053,
    longitude: 80.262,
    hasCEmONC: true,
    isOpen24x7: true,
  },
  {
    id: 'h_4',
    name: 'Urban Primary Health Centre - Tambaram Sanatorium',
    type: 'PHC',
    address: 'GST Road, Tambaram, Chennai, TN',
    phone: '044-22265432',
    distanceKm: 7.2,
    latitude: 12.924,
    longitude: 80.127,
    hasCEmONC: false,
    isOpen24x7: true,
  },
];

// Haversine formula to compute distance in km
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const fetchNearbyHospitalsRealtime = async (
  radiusMeters: number = 10000
): Promise<{ hospitals: HospitalLocationInfo[]; userCoords: { latitude: number; longitude: number } | null }> => {
  let userCoords: { latitude: number; longitude: number } | null = null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      userCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    }
  } catch (e) {
    console.log('GPS Location request issue, using default coordinates');
  }

  const lat = userCoords?.latitude || 12.9716;
  const lon = userCoords?.longitude || 80.245;

  try {
    // OpenStreetMap Overpass API Query for amenity=hospital within radius
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radiusMeters},${lat},${lon})[amenity=hospital];out;`;
    const response = await fetch(overpassUrl);
    const data = await response.json();

    if (data && data.elements && data.elements.length > 0) {
      const osmHospitals: HospitalLocationInfo[] = data.elements.slice(0, 15).map((elem: any, idx: number) => {
        const name = elem.tags?.name || elem.tags?.['name:en'] || `Emergency Health Clinic #${idx + 1}`;
        const isGovt = name.toLowerCase().includes('govt') || name.toLowerCase().includes('government') || name.toLowerCase().includes('phc');
        const isMat = name.toLowerCase().includes('maternity') || name.toLowerCase().includes('women') || name.toLowerCase().includes('child');
        
        const dist = calculateDistanceKm(lat, lon, elem.lat, elem.lon);

        return {
          id: `osm_${elem.id}`,
          name,
          type: isMat ? 'Maternity Center' : isGovt ? 'Government Hospital' : 'Emergency Hub',
          address: elem.tags?.['addr:street'] ? `${elem.tags['addr:street']}, ${elem.tags['addr:city'] || ''}` : `${dist} km from your current location`,
          phone: elem.tags?.phone || elem.tags?.['contact:phone'] || '108',
          distanceKm: dist,
          latitude: elem.lat,
          longitude: elem.lon,
          hasCEmONC: isGovt || isMat,
          isOpen24x7: elem.tags?.opening_hours === '24/7' || true,
        };
      }).sort((a: HospitalLocationInfo, b: HospitalLocationInfo) => a.distanceKm - b.distanceKm);

      return { hospitals: osmHospitals, userCoords };
    }
  } catch (e) {
    console.log('OSM Overpass API fetch offline, using fallback dataset:', e);
  }

  // Fallback with calculated distances
  const updatedFallback = FALLBACK_HOSPITALS.map(h => ({
    ...h,
    distanceKm: calculateDistanceKm(lat, lon, h.latitude, h.longitude),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  return { hospitals: updatedFallback, userCoords };
};
