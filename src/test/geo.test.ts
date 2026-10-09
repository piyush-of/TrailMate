import { describe, it, expect } from 'vitest';
import { haversineDistance, isValidGpsPoint, calculateTrackDistance } from '../lib/geo';

describe('Geo & Distance Logic', () => {
  it('calculates Haversine distance accurately between known points', () => {
    // Delhi to Mumbai approx 1148 km
    const dist = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1140000);
    expect(dist).toBeLessThan(1160000);

    // Identical points should be 0
    expect(haversineDistance(23.1765, 80.0185, 23.1765, 80.0185)).toBe(0);
  });

  it('rejects points with accuracy worse than 30 meters', () => {
    const valid = isValidGpsPoint(null, {
      lat: 23.1765,
      lng: 80.0185,
      acc: 45, // Bad accuracy
      t: Date.now(),
    });
    expect(valid).toBe(false);
  });

  it('accepts initial point with good accuracy', () => {
    const valid = isValidGpsPoint(null, {
      lat: 23.1765,
      lng: 80.0185,
      acc: 12,
      t: Date.now(),
    });
    expect(valid).toBe(true);
  });

  it('rejects sudden teleportation jumps (speed > 12 km/h walking speed)', () => {
    const prev = {
      adventureId: 'adv-1',
      lat: 23.1765,
      lng: 80.0185,
      acc: 10,
      t: 1000000,
    };
    // 500 meters away in 2 seconds is 250 m/s (~900 km/h)
    const valid = isValidGpsPoint(prev, {
      lat: 23.1810,
      lng: 80.0185,
      acc: 10,
      t: 1002000,
    });
    expect(valid).toBe(false);
  });

  it('calculates track distance properly', () => {
    const points = [
      { adventureId: 'adv-1', lat: 23.1765, lng: 80.0185, acc: 5, t: 1000 },
      { adventureId: 'adv-1', lat: 23.1770, lng: 80.0185, acc: 5, t: 1060 },
    ];
    const trackDist = calculateTrackDistance(points);
    expect(trackDist).toBeGreaterThan(50);
    expect(trackDist).toBeLessThan(60);
  });
});
