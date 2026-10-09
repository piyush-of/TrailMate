import { GpsPoint } from '../types';

/**
 * Calculates the great-circle distance between two coordinates in meters using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const MAX_ALLOWED_ACCURACY_M = 30; // Ignore GPS noise worse than 30 meters
export const MAX_WALKING_SPEED_MPS = 12 / 3.6; // 12 km/h converted to m/s (~3.33 m/s)

/**
 * Jitter filter: Validates if an incoming GPS point should be accepted.
 * Rejects points with poor accuracy (> 30 m) or impossible movement speeds (> 12 km/h).
 */
export function isValidGpsPoint(
  prevPoint: GpsPoint | null,
  nextPoint: { lat: number; lng: number; acc: number; t: number }
): boolean {
  // Reject low accuracy readings
  if (nextPoint.acc > MAX_ALLOWED_ACCURACY_M) {
    return false;
  }

  // First point is accepted if accuracy is acceptable
  if (!prevPoint) {
    return true;
  }

  const timeDeltaSeconds = (nextPoint.t - prevPoint.t) / 1000;
  if (timeDeltaSeconds <= 0) {
    return false;
  }

  const distanceM = haversineDistance(
    prevPoint.lat,
    prevPoint.lng,
    nextPoint.lat,
    nextPoint.lng
  );

  const speedMps = distanceM / timeDeltaSeconds;

  // Reject teleportation jumps / driving speeds
  if (speedMps > MAX_WALKING_SPEED_MPS) {
    return false;
  }

  return true;
}

/**
 * Calculates total distance in meters from an array of verified GPS points.
 */
export function calculateTrackDistance(points: GpsPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }
  return Math.round(total);
}
