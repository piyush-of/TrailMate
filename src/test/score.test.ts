import { describe, it, expect } from 'vitest';
import { calculateTouchGrassScore } from '../features/journal/score';

describe('Touch Grass Score Formula', () => {
  it('calculates perfect 100 score for full walk with zero excessive checks', () => {
    // 45 minutes, 2000 meters (2 km), 5 discoveries, 1 phone check
    const result = calculateTouchGrassScore(45, 2000, 5, 1);
    expect(result.score).toBe(100);
    expect(result.timePoints).toBe(40);
    expect(result.distancePoints).toBe(30);
    expect(result.discoveryPoints).toBe(30);
    expect(result.phonePenalty).toBe(0);
  });

  it('penalizes excessive phone checks (-5 per check beyond 2)', () => {
    // 45 min, 2 km, 5 discoveries, 6 phone checks -> 4 excess checks = -20 penalty
    const result = calculateTouchGrassScore(45, 2000, 5, 6);
    expect(result.phonePenalty).toBe(20);
    expect(result.score).toBe(80);
  });

  it('floors score at 0 rather than negative values', () => {
    // 1 min, 50 meters, 0 discoveries, 20 phone checks
    const result = calculateTouchGrassScore(1, 50, 0, 20);
    expect(result.score).toBe(0);
  });

  it('caps at 100 for higher distance or discoveries', () => {
    const result = calculateTouchGrassScore(90, 5000, 15, 0);
    expect(result.score).toBe(100);
  });
});
