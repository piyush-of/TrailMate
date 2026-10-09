import { Mood, Difficulty, PlannedMinutes, QuestItem } from '../../types';

interface QuestTemplate {
  text: string;
  type: 'walk' | 'photo' | 'discover' | 'sit' | 'audio';
  targetCategory?: 'plant' | 'bird' | 'insect' | 'other';
  targetLabelId?: string;
  moods: Mood[];
  difficulties: Difficulty[];
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // Relax
  {
    text: 'Sit under a canopy tree for 3 uninterrupted minutes and observe the wind',
    type: 'sit',
    moods: ['relax', 'photo'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    text: 'Photograph a Neem or Peepal tree leaf showing backlit veins',
    type: 'photo',
    targetCategory: 'plant',
    targetLabelId: 'neem_tree',
    moods: ['relax', 'photo', 'adventure'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    text: 'Walk 400 meters along a shaded path without glancing at your screen',
    type: 'walk',
    moods: ['relax', 'fitness'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Listen closely for 2 minutes to locate a bird call in the branches',
    type: 'audio',
    targetCategory: 'bird',
    moods: ['relax', 'adventure'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Find a patch of green moss or textured bark on a tree trunk',
    type: 'discover',
    targetCategory: 'plant',
    moods: ['relax', 'photo'],
    difficulties: ['easy', 'medium'],
  },

  // Adventure
  {
    text: 'Track down and photograph a wild bird (Parakeet, Myna, or Crow)',
    type: 'photo',
    targetCategory: 'bird',
    moods: ['adventure', 'photo'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    text: 'Explore an unpaved dirt trail or footpath off the main road',
    type: 'walk',
    moods: ['adventure', 'fitness'],
    difficulties: ['medium', 'hard'],
  },
  {
    text: 'Discover a butterfly or pollinator visiting flowering shrubs',
    type: 'discover',
    targetCategory: 'insect',
    moods: ['adventure', 'photo'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    text: 'Locate a Banyan tree with hanging prop roots',
    type: 'discover',
    targetCategory: 'plant',
    targetLabelId: 'banyan_tree',
    moods: ['adventure', 'photo'],
    difficulties: ['medium', 'hard'],
  },
  {
    text: 'Find a Palm Squirrel foraging on the ground or darting up a trunk',
    type: 'discover',
    targetCategory: 'other',
    targetLabelId: 'indian_palm_squirrel',
    moods: ['adventure'],
    difficulties: ['medium', 'hard'],
  },

  // Fitness
  {
    text: 'Brisk walk 1,000 meters to get your heart rate up in fresh air',
    type: 'walk',
    moods: ['fitness', 'adventure'],
    difficulties: ['medium', 'hard'],
  },
  {
    text: 'Complete 1,500 meters across campus without stopping',
    type: 'walk',
    moods: ['fitness'],
    difficulties: ['hard'],
  },
  {
    text: 'Power walk up an incline or stairs near a campus building',
    type: 'walk',
    moods: ['fitness'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    text: 'Spot and photograph a blooming flower (Hibiscus or Bougainvillea)',
    type: 'photo',
    targetCategory: 'plant',
    moods: ['fitness', 'photo', 'relax'],
    difficulties: ['easy', 'medium'],
  },

  // Photo
  {
    text: 'Capture a close-up macro photo of a colorful flower',
    type: 'photo',
    targetCategory: 'plant',
    moods: ['photo', 'relax'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Photograph natural rock formations or textured geological stones',
    type: 'photo',
    targetCategory: 'other',
    moods: ['photo', 'adventure'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Take a photo of a clear sky reflection in a water puddle or pond',
    type: 'photo',
    targetCategory: 'other',
    moods: ['photo', 'relax'],
    difficulties: ['medium', 'hard'],
  },
  {
    text: 'Frame a photo of campus architecture peeking through green branches',
    type: 'photo',
    targetCategory: 'other',
    moods: ['photo', 'social'],
    difficulties: ['easy', 'medium', 'hard'],
  },

  // Social
  {
    text: 'Walk 500 meters alongside a classmate or friend with phones in pockets',
    type: 'walk',
    moods: ['social', 'relax'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Rest on a wooden bench or grassy lawn together for 5 minutes',
    type: 'sit',
    moods: ['social', 'relax'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Spot and identify a friendly campus dog or cat resting peacefully',
    type: 'discover',
    targetCategory: 'other',
    moods: ['social', 'relax', 'adventure'],
    difficulties: ['easy', 'medium'],
  },
  {
    text: 'Find 3 fallen leaves of completely distinct shapes and compare them',
    type: 'discover',
    targetCategory: 'plant',
    moods: ['social', 'photo', 'adventure'],
    difficulties: ['easy', 'medium'],
  },
];

/**
 * Generates an outdoor quest checklist based on user inputs.
 */
export function generateQuest(
  mood: Mood,
  difficulty: Difficulty,
  minutes: PlannedMinutes
): QuestItem[] {
  // Determine item count based on duration
  const targetCount = minutes === 15 ? 3 : minutes === 30 ? 4 : 5;

  // Filter templates matching criteria
  const matching = QUEST_TEMPLATES.filter(
    (t) => t.moods.includes(mood) && t.difficulties.includes(difficulty)
  );

  // Fallback to broader list if not enough matches
  const pool = matching.length >= targetCount ? matching : QUEST_TEMPLATES;

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, targetCount);

  return selected.map((template, index) => ({
    id: `quest_${Date.now()}_${index}`,
    text: template.text,
    type: template.type,
    done: false,
    targetCategory: template.targetCategory,
    targetLabelId: template.targetLabelId,
  }));
}
