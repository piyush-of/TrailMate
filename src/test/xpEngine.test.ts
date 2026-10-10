import { describe, it, expect } from 'vitest';
import {
  deriveTotalXp,
  deriveLevel,
  evaluateBadges,
  calculateStreak,
  computeFinishXpEvents,
  sumXpForAdventure,
  localDayKey,
} from '../features/rewards/xpEngine';
import { XpEvent, Adventure, Discovery, QuestItem } from '../types';

describe('XP & Rewards Engine', () => {
  it('sums append-only XP events and respects 500 XP daily cap', () => {
    const today = Date.now();
    const events: XpEvent[] = [
      { id: '1', adventureId: 'a1', kind: 'start', xp: 10, at: today, synced: 0 },
      { id: '2', adventureId: 'a1', kind: 'plant_id', xp: 15, at: today, synced: 0 },
      { id: '3', adventureId: 'a1', kind: 'huge_bonus', xp: 600, at: today, synced: 0 }, // exceeds 500
    ];

    const total = deriveTotalXp(events);
    // 10 + 15 + remaining capped at 500 -> total must be exactly 500
    expect(total).toBe(500);
  });

  it('derives levels and progress percentages correctly', () => {
    expect(deriveLevel(0).title).toBe('Grass Starter');
    expect(deriveLevel(0).level).toBe(1);

    const lv2 = deriveLevel(150);
    expect(lv2.title).toBe('Trail Walker');
    expect(lv2.level).toBe(2);
    expect(lv2.progressPercent).toBe(25); // 150 - 100 / (300 - 100) = 50/200 = 25%

    const lv5 = deriveLevel(1600);
    expect(lv5.title).toBe('Trail Master');
    expect(lv5.level).toBe(5);
  });

  it('evaluates badge unlock conditions', () => {
    const adventures: Adventure[] = [
      {
        id: 'adv-1',
        startedAt: Date.now() - 3600000,
        endedAt: Date.now(),
        mood: 'adventure',
        difficulty: 'medium',
        plannedMinutes: 30,
        distanceM: 10500, // > 10 km
        wasOffline: true,
        phoneChecks: 1,
        quest: [],
      },
    ];

    const discoveries: Discovery[] = [
      { id: 'd1', adventureId: 'adv-1', label: 'House Crow', category: 'bird', confidence: 0.9, at: Date.now() },
      { id: 'd2', adventureId: 'adv-1', label: 'Myna', category: 'bird', confidence: 0.88, at: Date.now() },
      { id: 'd3', adventureId: 'adv-1', label: 'Parrot', category: 'bird', confidence: 0.85, at: Date.now() },
      { id: 'd4', adventureId: 'adv-1', label: 'Pigeon', category: 'bird', confidence: 0.92, at: Date.now() },
      { id: 'd5', adventureId: 'adv-1', label: 'Bulbul', category: 'bird', confidence: 0.8, at: Date.now() },
    ];

    const badges = evaluateBadges(adventures, discoveries, []);
    expect(badges).toContain('first_step');
    expect(badges).toContain('trail_walker');
    expect(badges).toContain('bird_watcher');
    expect(badges).toContain('no_signal_explorer');
  });

  it('computes 3-day streak correctly', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const adventures: Adventure[] = [
      { id: '1', startedAt: now, endedAt: now + 1000, mood: 'relax', difficulty: 'easy', plannedMinutes: 15, distanceM: 500, wasOffline: false, phoneChecks: 0, quest: [] },
      { id: '2', startedAt: now - oneDay, endedAt: now - oneDay + 1000, mood: 'relax', difficulty: 'easy', plannedMinutes: 15, distanceM: 500, wasOffline: false, phoneChecks: 0, quest: [] },
      { id: '3', startedAt: now - (2 * oneDay), endedAt: now - (2 * oneDay) + 1000, mood: 'relax', difficulty: 'easy', plannedMinutes: 15, distanceM: 500, wasOffline: false, phoneChecks: 0, quest: [] },
    ];

    expect(calculateStreak(adventures)).toBe(3);
  });

  it('applies the daily cap in time order, not array order', () => {
    const day = new Date(2026, 9, 10, 12).getTime();
    const events: XpEvent[] = [
      { id: 'b', adventureId: 'a', kind: 'late', xp: 400, at: day + 2000, synced: 0 },
      { id: 'a', adventureId: 'a', kind: 'early', xp: 400, at: day + 1000, synced: 0 },
    ];
    expect(deriveTotalXp(events)).toBe(500);
    expect(deriveTotalXp([...events].reverse())).toBe(500);
  });

  it('uses the local calendar day for the cap boundary', () => {
    const late = new Date(2026, 9, 10, 23, 59).getTime();
    const early = new Date(2026, 9, 11, 0, 1).getTime();
    expect(localDayKey(late)).not.toBe(localDayKey(early));
  });

  it('sums raw XP for one adventure', () => {
    const ev: XpEvent[] = [
      { id: '1', adventureId: 'a', kind: 'x', xp: 10, at: 1, synced: 0 },
      { id: '2', adventureId: 'b', kind: 'x', xp: 99, at: 1, synced: 0 },
    ];
    expect(sumXpForAdventure(ev, 'a')).toBe(10);
  });
});

describe('computeFinishXpEvents', () => {
  const q = (done: boolean[]): QuestItem[] => done.map((d, i) => ({ id: String(i), text: '', type: 'walk', done: d }));
  const total = (e: Array<{ xp: number }>) => e.reduce((s, x) => s + x.xp, 0);

  it('awards quest-complete only when EVERY item is done', () => {
    expect(computeFinishXpEvents({ quest: q([true, false]), distanceM: 0, durationMinutes: 10 }).some((e) => e.kind === 'quest_complete')).toBe(false);
    expect(computeFinishXpEvents({ quest: q([true, true]), distanceM: 0, durationMinutes: 10 }).some((e) => e.kind === 'quest_complete')).toBe(true);
  });

  it('gives no quest XP for implausibly short adventures (tick-all-and-finish exploit)', () => {
    expect(total(computeFinishXpEvents({ quest: q([true, true, true]), distanceM: 0, durationMinutes: 0 }))).toBe(0);
  });

  it('awards distance (per 500 m, capped) and time bonuses', () => {
    const e = computeFinishXpEvents({ quest: [], distanceM: 1700, durationMinutes: 35 });
    expect(e).toContainEqual({ kind: 'distance', xp: 30 });
    expect(e).toContainEqual({ kind: 'time_30m', xp: 30 });
    expect(computeFinishXpEvents({ quest: [], distanceM: 999999, durationMinutes: 61 }).find((x) => x.kind === 'distance')!.xp).toBe(200);
  });
});
