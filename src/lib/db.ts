import Dexie, { type EntityTable } from 'dexie';
import { Adventure, Discovery, XpEvent, BadgeUnlock, GpsPoint, QuestItem } from '../types';

export class TrailMateDatabase extends Dexie {
  adventures!: EntityTable<Adventure, 'id'>;
  discoveries!: EntityTable<Discovery, 'id'>;
  xp_events!: EntityTable<XpEvent, 'id'>;
  badge_unlocks!: EntityTable<BadgeUnlock, 'badgeId'>;
  gps_points!: EntityTable<GpsPoint & { id?: number }, 'id'>;

  constructor() {
    super('TrailMateDB');
    this.version(1).stores({
      adventures: 'id, startedAt, mood, difficulty',
      discoveries: 'id, adventureId, category, at',
      xp_events: 'id, adventureId, kind, at, synced',
      badge_unlocks: 'badgeId, at, adventureId',
      gps_points: '++id, adventureId, t',
    });
  }
}

export const db = new TrailMateDatabase();

export const uid = (prefix: string): string =>
  `${prefix}_${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()}`;

/** Appends an immutable XP event to the ledger. */
export async function logXpEvent(adventureId: string, kind: string, xp: number): Promise<XpEvent> {
  const event: XpEvent = { id: uid('xp'), adventureId, kind, xp, at: Date.now(), synced: 0 };
  await db.xp_events.add(event);
  return event;
}

/** Appends several XP events atomically. */
export async function logXpEvents(adventureId: string, events: Array<{ kind: string; xp: number }>): Promise<void> {
  const now = Date.now();
  await db.xp_events.bulkAdd(
    events.map((e, i) => ({ id: uid('xp'), adventureId, kind: e.kind, xp: e.xp, at: now + i, synced: 0 as const }))
  );
}

/**
 * Logs a discovery. XP is only awarded the first time a given label is found in an adventure,
 * so photographing the same tree repeatedly can't farm XP.
 */
export async function logDiscovery(
  discovery: Omit<Discovery, 'id' | 'at'>
): Promise<{ discovery: Discovery; xp: number }> {
  const full: Discovery = { ...discovery, id: uid('disc'), at: Date.now() };
  let xp = 0;

  await db.transaction('rw', db.discoveries, db.xp_events, async () => {
    const already = await db.discoveries
      .where('adventureId')
      .equals(discovery.adventureId)
      .filter((d) => d.label === discovery.label)
      .count();
    await db.discoveries.add(full);
    if (already === 0) {
      xp = discovery.category === 'bird' ? 20 : 15;
      await db.xp_events.add({
        id: uid('xp'),
        adventureId: discovery.adventureId,
        kind: `${discovery.category}_id`,
        xp,
        at: Date.now(),
        synced: 0,
      });
    }
  });

  return { discovery: full, xp };
}

/** Persist quest progress so it survives the app being killed in the background. */
export const saveQuestProgress = (adventureId: string, quest: QuestItem[]) =>
  db.adventures.update(adventureId, { quest });

/** Most recent adventure that was started but never finished (for resume), if recent enough. */
export async function getResumableAdventure(maxAgeMs = 12 * 60 * 60 * 1000): Promise<Adventure | null> {
  const all = await db.adventures.orderBy('startedAt').reverse().toArray();
  const latest = all.find((a) => !a.endedAt);
  return latest && Date.now() - latest.startedAt < maxAgeMs ? latest : null;
}
