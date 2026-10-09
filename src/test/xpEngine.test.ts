import { describe, it, expect } from 'vitest';
import {
  deriveTotalXp,
  deriveLevel,
  evaluateBadges,
  calculateStreak,
} from '../features/rewards/xpEngine';
import { XpEvent, Adventure, Discovery } from '../types';

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
});
