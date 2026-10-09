# Data Model (Dexie / IndexedDB)

```ts
interface Adventure {
  id: string;            // uuid
  startedAt: number;     // epoch ms
  endedAt?: number;
  mood: 'relax' | 'adventure' | 'fitness' | 'photo' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
  plannedMinutes: 15 | 30 | 60;
  distanceM: number;
  wasOffline: boolean;   // offline for the entire adventure
  phoneChecks: number;
  quest: QuestItem[];
  score?: number;
}

interface QuestItem { id: string; text: string; type: 'walk'|'photo'|'discover'|'sit'|'audio'; done: boolean; }

interface Discovery {
  id: string; adventureId: string; label: string; category: 'plant'|'bird'|'insect'|'other';
  confidence: number; at: number; thumb?: Blob;
}

interface XpEvent {          // append-only
  id: string; adventureId: string; kind: string; xp: number; at: number; synced: 0|1;
}

interface BadgeUnlock { badgeId: string; at: number; adventureId?: string; }

interface GpsPoint { adventureId: string; lat: number; lng: number; acc: number; t: number; }
```

Indexes: `Adventure.startedAt`, `Discovery.adventureId`, `XpEvent.adventureId`, `XpEvent.synced`.

Derived (never stored): total XP = sum(XpEvent.xp), level from thresholds, streak from adventure dates.

## Stretch: Supabase tables
`profiles`, `adventures`, `xp_events`, `badge_unlocks`, `campus_leaderboard (view)`. Sync = upload `XpEvent` where `synced=0`, server validates caps, then mark `synced=1`.
