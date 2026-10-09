import Dexie, { type EntityTable } from 'dexie';
import { Adventure, Discovery, XpEvent, BadgeUnlock, GpsPoint } from '../types';

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

/**
 * Appends an immutable XP event to the database.
 */
export async function logXpEvent(
  adventureId: string,
  kind: string,
  xp: number
): Promise<XpEvent> {
  const event: XpEvent = {
    id: 'xp_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
    adventureId,
    kind,
    xp,
    at: Date.now(),
    synced: 0,
  };
  await db.xp_events.add(event);
  return event;
}

/**
 * Logs a new discovery and records corresponding XP.
 */
export async function logDiscovery(
  discovery: Omit<Discovery, 'id' | 'at'>
): Promise<Discovery> {
  const fullDiscovery: Discovery = {
    ...discovery,
    id: 'disc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
    at: Date.now(),
  };

  await db.transaction('rw', db.discoveries, db.xp_events, async () => {
    await db.discoveries.add(fullDiscovery);

    // XP based on type
    const xpAmount = discovery.category === 'bird' ? 20 : 15;
    await db.xp_events.add({
      id: 'xp_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      adventureId: discovery.adventureId,
      kind: `${discovery.category}_id`,
      xp: xpAmount,
      at: Date.now(),
      synced: 0,
    });
  });

  return fullDiscovery;
}
