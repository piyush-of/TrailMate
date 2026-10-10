import { XpEvent, LevelInfo, BadgeDefinition, Adventure, Discovery, QuestItem } from '../../types';

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Grass Starter', minXp: 0 },
  { level: 2, title: 'Trail Walker', minXp: 100 },
  { level: 3, title: 'Nature Explorer', minXp: 300 },
  { level: 4, title: 'Trail Adventurer', minXp: 700 },
  { level: 5, title: 'Trail Master', minXp: 1500 },
];

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  first_step: {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete 1 full outdoor adventure',
    icon: '🌱',
  },
  trail_walker: {
    id: 'trail_walker',
    title: 'Trail Walker',
    description: 'Cover 10 km cumulative distance outdoors',
    icon: '🥾',
  },
  bird_watcher: {
    id: 'bird_watcher',
    title: 'Bird Watcher',
    description: 'Identify 5 birds or bird calls',
    icon: '🐦',
  },
  tree_hugger: {
    id: 'tree_hugger',
    title: 'Tree Hugger',
    description: 'Identify 10 native trees or plants',
    icon: '🌳',
  },
  streak_3: {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Step outside 3 consecutive days',
    icon: '🔥',
  },
  no_signal_explorer: {
    id: 'no_signal_explorer',
    title: 'No Signal Explorer',
    description: 'Complete an entire adventure strictly in Airplane Mode / Offline',
    icon: '📡',
  },
};

export const DAILY_XP_CAP = 500;

/** Local calendar day (YYYY-MM-DD) - the day boundary users actually experience. */
export function localDayKey(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Derives total XP from the immutable append-only event stream.
 * Events are applied in time order and capped at 500 XP per local calendar day.
 */
export function deriveTotalXp(events: XpEvent[]): number {
  if (events.length === 0) return 0;

  const dailyTotals = new Map<string, number>();
  const ordered = [...events].sort((a, b) => a.at - b.at);

  for (const event of ordered) {
    const key = localDayKey(event.at);
    const current = dailyTotals.get(key) || 0;
    const allowed = Math.max(0, DAILY_XP_CAP - current);
    dailyTotals.set(key, current + Math.min(Math.max(0, event.xp), allowed));
  }

  let grandTotal = 0;
  dailyTotals.forEach((t) => (grandTotal += t));
  return grandTotal;
}

/** Raw XP logged for one adventure (before the daily cap) - used for the recap screen. */
export function sumXpForAdventure(events: XpEvent[], adventureId: string): number {
  return events.filter((e) => e.adventureId === adventureId).reduce((sum, e) => sum + e.xp, 0);
}

export const MIN_REWARD_DURATION_MIN = 2;

/**
 * XP events earned when an adventure is finished (start + discovery XP are logged separately).
 * Sanity checks: quest/challenge XP needs a minimum duration, "quest complete" needs every item done.
 */
export function computeFinishXpEvents(input: {
  quest: QuestItem[];
  distanceM: number;
  durationMinutes: number;
}): Array<{ kind: string; xp: number }> {
  const events: Array<{ kind: string; xp: number }> = [];
  const { quest, distanceM, durationMinutes } = input;
  const plausible = durationMinutes >= MIN_REWARD_DURATION_MIN;

  const done = quest.filter((q) => q.done).length;
  if (plausible && done > 0) events.push({ kind: 'challenge_done', xp: done * 20 });
  if (plausible && quest.length > 0 && done === quest.length) events.push({ kind: 'quest_complete', xp: 50 });

  const steps = Math.min(20, Math.floor(distanceM / 500));
  if (steps > 0) events.push({ kind: 'distance', xp: steps * 10 });

  if (durationMinutes >= 60) events.push({ kind: 'time_60m', xp: 75 });
  else if (durationMinutes >= 30) events.push({ kind: 'time_30m', xp: 30 });

  return events;
}

/**
 * Derives user level and progression metrics from total XP.
 */
export function deriveLevel(totalXp: number): LevelInfo {
  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || {
        level: currentTier.level,
        title: currentTier.title,
        minXp: currentTier.minXp * 2,
      };
      break;
    }
  }

  const range = nextTier.minXp - currentTier.minXp;
  const progressInTier = totalXp - currentTier.minXp;
  const progressPercent = Math.min(100, Math.round((progressInTier / (range || 1)) * 100));

  return {
    level: currentTier.level,
    title: currentTier.title,
    currentXp: totalXp,
    nextLevelXp: nextTier.minXp,
    progressPercent,
  };
}

/**
 * Computes consecutive adventure streak in days.
 */
export function calculateStreak(adventures: Adventure[]): number {
  if (adventures.length === 0) return 0;

  const finishedDays = Array.from(
    new Set(
      adventures
        .filter((a) => a.endedAt)
        .map((a) => new Date(a.startedAt).toDateString())
    )
  ).map((d) => new Date(d).getTime()).sort((a, b) => b - a);

  if (finishedDays.length === 0) return 0;

  let streak = 0;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = new Date(new Date().toDateString()).getTime();

  // Check if latest adventure was today or yesterday
  const latest = finishedDays[0];
  if (today - latest > oneDayMs) {
    return 0; // Streak broken
  }

  let expected = latest;
  for (const day of finishedDays) {
    if (Math.abs(expected - day) <= oneDayMs / 2) {
      streak++;
      expected -= oneDayMs;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Evaluates which badges should be unlocked based on adventure history & discoveries.
 */
export function evaluateBadges(
  adventures: Adventure[],
  discoveries: Discovery[],
  existingBadgeIds: string[]
): string[] {
  const newBadgeIds: string[] = [];
  const completedAdventures = adventures.filter((a) => a.endedAt);

  // 1. First Step: 1 completed adventure
  if (!existingBadgeIds.includes('first_step') && completedAdventures.length >= 1) {
    newBadgeIds.push('first_step');
  }

  // 2. Trail Walker: 10 km total (10,000 meters)
  const totalMeters = completedAdventures.reduce((sum, a) => sum + (a.distanceM || 0), 0);
  if (!existingBadgeIds.includes('trail_walker') && totalMeters >= 10000) {
    newBadgeIds.push('trail_walker');
  }

  // 3. Bird Watcher: 5 bird IDs
  const birdCount = discoveries.filter((d) => d.category === 'bird').length;
  if (!existingBadgeIds.includes('bird_watcher') && birdCount >= 5) {
    newBadgeIds.push('bird_watcher');
  }

  // 4. Tree Hugger: 10 plant IDs
  const plantCount = discoveries.filter((d) => d.category === 'plant').length;
  if (!existingBadgeIds.includes('tree_hugger') && plantCount >= 10) {
    newBadgeIds.push('tree_hugger');
  }

  // 5. 3-Day Streak
  const streak = calculateStreak(completedAdventures);
  if (!existingBadgeIds.includes('streak_3') && streak >= 3) {
    newBadgeIds.push('streak_3');
  }

  // 6. No Signal Explorer: At least one adventure with wasOffline === true
  const offlineAdventures = completedAdventures.filter((a) => a.wasOffline);
  if (!existingBadgeIds.includes('no_signal_explorer') && offlineAdventures.length >= 1) {
    newBadgeIds.push('no_signal_explorer');
  }

  return newBadgeIds;
}
