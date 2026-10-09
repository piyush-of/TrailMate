export type Mood = 'relax' | 'adventure' | 'fitness' | 'photo' | 'social';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PlannedMinutes = 15 | 30 | 60;
export type DiscoveryCategory = 'plant' | 'bird' | 'insect' | 'other';
export type QuestType = 'walk' | 'photo' | 'discover' | 'sit' | 'audio';

export interface QuestItem {
  id: string;
  text: string;
  type: QuestType;
  done: boolean;
  targetCategory?: DiscoveryCategory;
  targetLabelId?: string;
}

export interface Adventure {
  id: string;
  startedAt: number;
  endedAt?: number;
  mood: Mood;
  difficulty: Difficulty;
  plannedMinutes: PlannedMinutes;
  distanceM: number;
  wasOffline: boolean;
  phoneChecks: number;
  quest: QuestItem[];
  score?: number;
}

export interface Discovery {
  id: string;
  adventureId: string;
  label: string;
  category: DiscoveryCategory;
  confidence: number;
  at: number;
  thumb?: string; // Data URL or object URL string for storage & rendering
}

export interface XpEvent {
  id: string;
  adventureId: string;
  kind: string;
  xp: number;
  at: number;
  synced: 0 | 1;
}

export interface BadgeUnlock {
  badgeId: string;
  at: number;
  adventureId?: string;
}

export interface GpsPoint {
  adventureId: string;
  lat: number;
  lng: number;
  acc: number;
  t: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface CampusLabel {
  id: string;
  label: string;
  category: DiscoveryCategory;
  hint: string;
}

export interface ClassificationResult {
  label: string;
  category: DiscoveryCategory;
  confidence: number;
  isConfident: boolean;
  alternatives?: Array<{ label: string; confidence: number }>;
}

export interface WorkerProgressMessage {
  type: 'progress';
  progress: number;
  status: string;
}

export interface WorkerReadyMessage {
  type: 'ready';
}

export interface WorkerResultMessage {
  type: 'result';
  result: ClassificationResult;
}

export interface WorkerErrorMessage {
  type: 'error';
  error: string;
}

export type WorkerMessage =
  | WorkerProgressMessage
  | WorkerReadyMessage
  | WorkerResultMessage
  | WorkerErrorMessage;
