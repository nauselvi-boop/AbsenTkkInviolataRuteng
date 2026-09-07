import { GeofenceConfig, LocationData } from '../types';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Evaluates location against Geofence configuration and anti-fake GPS checks.
 */
export function evaluateGeofence(
  userLat: number,
  userLng: number,
  accuracy: number,
  config: GeofenceConfig,
  previousLocation?: { lat: number; lng: number; timestamp: number }
): LocationData {
  const distance = calculateDistanceMeters(
    userLat,
    userLng,
    config.latitude,
    config.longitude
  );

  const isWithinGeofence = distance <= config.radiusMeters;

  // Anti-fake GPS detection heuristics
  let isMockDetected = false;
  let mockReason = '';

  if (config.antiFakeGpsEnabled) {
    // 1. Imprecise accuracy check
    if (accuracy > config.maxAllowedAccuracyMeters) {
      isMockDetected = true;
      mockReason = `Akurasi sinyal GPS terlalu rendah (±${Math.round(accuracy)}m > ${config.maxAllowedAccuracyMeters}m). Kemungkinan sinyal disimulasikan atau terhalang.`;
    }
    // 2. Suspicious 0m or negative accuracy (common in low-quality mock GPS apps)
    else if (accuracy <= 0) {
      isMockDetected = true;
      mockReason = 'Nilai akurasi sensor tidak wajar (0m). Terdeteksi aplikasi Fake GPS.';
    }
    // 3. Unrealistic speed/teleportation check if previous position exists
    else if (previousLocation) {
      const timeDiffSec = (Date.now() - previousLocation.timestamp) / 1000;
      if (timeDiffSec > 0 && timeDiffSec < 30) {
        const movedMeters = calculateDistanceMeters(
          previousLocation.lat,
          previousLocation.lng,
          userLat,
          userLng
        );
        const speedMps = movedMeters / timeDiffSec;
        // If speed exceeds 150 km/h (41.6 m/s) in short interval, likely location spoofing
        if (speedMps > 42) {
          isMockDetected = true;
          mockReason = `Perubahan lokasi abnormal terdeteksi (${Math.round(speedMps * 3.6)} km/jam).`;
        }
      }
    }
  }

  return {
    latitude: userLat,
    longitude: userLng,
    accuracy: Math.round(accuracy),
    distanceMeters: distance,
    isWithinGeofence: isWithinGeofence && !isMockDetected,
    addressName: `${config.schoolName} (${distance}m dari titik pusat)`,
    isMockDetected,
    mockReason,
  };
}

/**
 * Formats distance into friendly Indonesian text
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}
