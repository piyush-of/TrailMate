import type { CampusLabel, ClassificationResult } from '../../types';

export const CONFIDENCE_THRESHOLD = 0.35;

/**
 * Things that are NOT nature. Added as extra candidates so that a photo of a room, a person
 * or a screen doesn't get forced into one of the nature labels (CLIP always picks *something*).
 */
export const DISTRACTOR_PROMPTS = [
  'person',
  'human hand',
  'building',
  'room indoors',
  'computer screen',
  'document with text',
  'road with vehicles',
];

export interface RawScore {
  label: string;
  score: number;
}

export const promptFor = (l: CampusLabel) => l.label.toLowerCase();

/**
 * Turns raw zero-shot scores into an honest result.
 * - top1 is a distractor           -> "not nature"
 * - top1 nature score < threshold  -> "not sure"
 * - otherwise                      -> confident label
 */
export function interpretScores(raw: RawScore[], labels: CampusLabel[]): ClassificationResult {
  const byPrompt = new Map(labels.map((l) => [promptFor(l), l]));
  const sorted = [...raw].sort((a, b) => b.score - a.score);
  const round = (n: number) => Math.round(n * 100) / 100;

  const nature = sorted
    .filter((r) => byPrompt.has(r.label))
    .map((r) => ({ meta: byPrompt.get(r.label)!, confidence: round(r.score) }));

  const top = sorted[0];
  const topNature = nature[0];

  if (!top || !topNature) {
    return { label: 'Unknown', category: 'other', confidence: 0, isConfident: false, reason: 'low_confidence' };
  }

  const alternatives = nature.slice(1, 4).map((n) => ({ label: n.meta.label, confidence: n.confidence }));

  if (!byPrompt.has(top.label)) {
    return {
      label: 'Not a nature subject',
      category: 'other',
      confidence: round(top.score),
      isConfident: false,
      reason: 'not_nature',
      alternatives,
    };
  }

  const isConfident = topNature.confidence >= CONFIDENCE_THRESHOLD;
  return {
    label: isConfident ? topNature.meta.label : 'Unknown',
    labelId: isConfident ? topNature.meta.id : undefined,
    category: topNature.meta.category,
    confidence: topNature.confidence,
    isConfident,
    reason: isConfident ? undefined : 'low_confidence',
    alternatives: isConfident ? alternatives : nature.slice(0, 3).map((n) => ({ label: n.meta.label, confidence: n.confidence })),
  };
}
