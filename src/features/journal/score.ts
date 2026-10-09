export interface TouchGrassScoreBreakdown {
  score: number;
  timePoints: number;
  distancePoints: number;
  discoveryPoints: number;
  phonePenalty: number;
  minutes: number;
  km: number;
  discoveriesCount: number;
  phoneChecks: number;
}

/**
 * Calculates the Touch Grass Score (0 - 100) based on outdoor time, distance covered,
 * AI discoveries made, and penalizes excessive screen checks.
 *
 * Formula:
 * score = min(100, round( 0.4*min(minutes/45,1)*100 + 0.3*min(km/2,1)*100 + 0.3*min(discoveries/5,1)*100 ) - 5*max(0, phoneChecks-2))
 * floored at 0.
 */
export function calculateTouchGrassScore(
  minutes: number,
  distanceMeters: number,
  discoveriesCount: number,
  phoneChecks: number
): TouchGrassScoreBreakdown {
  const km = distanceMeters / 1000;

  const timeRatio = Math.min(minutes / 45, 1);
  const timePoints = Math.round(0.4 * timeRatio * 100);

  const distRatio = Math.min(km / 2, 1);
  const distancePoints = Math.round(0.3 * distRatio * 100);

  const discRatio = Math.min(discoveriesCount / 5, 1);
  const discoveryPoints = Math.round(0.3 * discRatio * 100);

  const excessChecks = Math.max(0, phoneChecks - 2);
  const phonePenalty = 5 * excessChecks;

  const rawScore = timePoints + distancePoints + discoveryPoints - phonePenalty;
  const clampedScore = Math.max(0, Math.min(100, rawScore));

  return {
    score: clampedScore,
    timePoints,
    distancePoints,
    discoveryPoints,
    phonePenalty,
    minutes: Math.round(minutes * 10) / 10,
    km: Math.round(km * 100) / 100,
    discoveriesCount,
    phoneChecks,
  };
}
