import { describe, it, expect } from 'vitest';
import { interpretScores, DISTRACTOR_PROMPTS } from '../features/identify/interpret';
import type { CampusLabel } from '../types';

const labels: CampusLabel[] = [
  { id: 'neem_tree', label: 'Neem Tree', category: 'plant', hint: '' },
  { id: 'house_crow', label: 'House Crow', category: 'bird', hint: '' },
  { id: 'banyan_tree', label: 'Banyan Tree', category: 'plant', hint: '' },
];

describe('interpretScores (honest AI)', () => {
  it('returns a confident label above the threshold', () => {
    const r = interpretScores([{ label: 'neem tree', score: 0.8 }, { label: 'house crow', score: 0.1 }, { label: 'person', score: 0.1 }], labels);
    expect(r.isConfident).toBe(true);
    expect(r.label).toBe('Neem Tree');
    expect(r.labelId).toBe('neem_tree');
  });

  it('says "not sure" below the threshold and never reports a label', () => {
    const r = interpretScores([{ label: 'neem tree', score: 0.3 }, { label: 'house crow', score: 0.2 }, { label: 'banyan tree', score: 0.1 }], labels);
    expect(r.isConfident).toBe(false);
    expect(r.reason).toBe('low_confidence');
    expect(r.label).toBe('Unknown');
    expect(r.labelId).toBeUndefined();
  });

  it('rejects non-nature subjects when a distractor wins', () => {
    const r = interpretScores([{ label: DISTRACTOR_PROMPTS[0], score: 0.7 }, { label: 'neem tree', score: 0.2 }], labels);
    expect(r.isConfident).toBe(false);
    expect(r.reason).toBe('not_nature');
  });

  it('handles empty input without throwing', () => {
    expect(interpretScores([], labels).isConfident).toBe(false);
  });
});
