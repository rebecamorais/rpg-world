import type { Database } from '@database-types';

export type SystemId = 'dnd5e';
export type DbSystem = Database['public']['Enums']['rpg_system'];

export interface GameSystemInfo {
  id: SystemId;
  dbValue: DbSystem;
  labelKey: string;
  levels: { min: number; max: number };
}

export const SYSTEMS: Readonly<Record<SystemId, GameSystemInfo>> = {
  dnd5e: {
    id: 'dnd5e',
    dbValue: 'dnd_5e',
    labelKey: 'systems.dnd5e',
    levels: { min: 1, max: 20 },
  },
};

export const DEFAULT_SYSTEM: SystemId = 'dnd5e';

// Accepted spellings, matched exactly (no case folding) so we never accept
// variations that never existed: `dnd5e` is canonical, `DnD_5e` is the old
// domain value (saved links, cached clients) and `dnd_5e` is the database enum.
const ALIASES: Readonly<Record<string, SystemId>> = {
  dnd5e: 'dnd5e',
  DnD_5e: 'dnd5e',
  dnd_5e: 'dnd5e',
};

export function parseSystemId(value: string): SystemId | null {
  return Object.hasOwn(ALIASES, value) ? ALIASES[value] : null;
}

export function toDbSystem(id: SystemId): DbSystem {
  return SYSTEMS[id].dbValue;
}

export function fromDbSystem(value: string): SystemId | null {
  const match = Object.values(SYSTEMS).find((system) => system.dbValue === value);
  return match ? match.id : null;
}
