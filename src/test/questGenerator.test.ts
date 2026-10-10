import { describe, it, expect } from 'vitest';
import { generateQuest, applyDiscoveryToQuest, QUEST_TEMPLATES } from '../features/quest/questGenerator';
import type { Mood, Difficulty, PlannedMinutes, QuestItem } from '../types';

describe('generateQuest', () => {
  const moods: Mood[] = ['relax', 'adventure', 'fitness', 'photo', 'social'];
  const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
  const mins: Array<[PlannedMinutes, number]> = [[15, 3], [30, 4], [60, 5]];

  it('always returns the requested number of unique items for every combination', () => {
    for (const m of moods) for (const d of diffs) for (const [t, n] of mins) {
      const q = generateQuest(m, d, t);
      expect(q).toHaveLength(n);
      expect(new Set(q.map((i) => i.text)).size).toBe(n);
    }
  });

  it('still respects the mood when few templates match mood + difficulty (social + hard)', () => {
    const socialTexts = new Set(QUEST_TEMPLATES.filter((t) => t.moods.includes('social')).map((t) => t.text));
    const q = generateQuest('social', 'hard', 30, () => 0.5);
    expect(q.filter((i) => socialTexts.has(i.text)).length).toBeGreaterThanOrEqual(3);
  });
});

describe('applyDiscoveryToQuest', () => {
  const mk = (over: Partial<QuestItem>): QuestItem => ({ id: Math.random().toString(), text: 't', type: 'photo', done: false, ...over });

  it('ticks only ONE item per discovery', () => {
    const items = [mk({ targetCategory: 'plant' }), mk({ targetCategory: 'plant' }), mk({ targetCategory: 'plant' })];
    const out = applyDiscoveryToQuest(items, { category: 'plant' });
    expect(out.filter((i) => i.done)).toHaveLength(1);
  });

  it('prefers an exact label match over a category match', () => {
    const items = [mk({ targetCategory: 'plant' }), mk({ targetCategory: 'plant', targetLabelId: 'neem_tree' })];
    const out = applyDiscoveryToQuest(items, { labelId: 'neem_tree', category: 'plant' });
    expect(out[1].done).toBe(true);
    expect(out[0].done).toBe(false);
  });

  it('does not tick walk/sit items or items of another category', () => {
    const items = [mk({ type: 'walk' }), mk({ targetCategory: 'bird' })];
    expect(applyDiscoveryToQuest(items, { category: 'plant' }).some((i) => i.done)).toBe(false);
  });
});
