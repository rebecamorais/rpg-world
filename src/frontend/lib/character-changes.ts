import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

// The server merges these key by key, so only the keys that changed go: STR edited on one device
// and DEX on another both survive
const MERGED_BY_KEY = ['attributes', 'skills'] as const;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What to send on save: the edited fields that differ from the server copy the edits started
 * from. Sending the whole character would overwrite whatever another device saved meanwhile.
 */
export function characterChanges(
  base: DnD5eCharacter,
  edits: Partial<DnD5eCharacter>,
): Partial<DnD5eCharacter> {
  const changes: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(edits)) {
    const before = base[key as keyof DnD5eCharacter];
    if ((MERGED_BY_KEY as readonly string[]).includes(key) && value && typeof value === 'object') {
      const previous = (before ?? {}) as Record<string, unknown>;
      const changed = Object.entries(value).filter(([k, v]) => !same(previous[k], v));
      if (changed.length > 0) changes[key] = Object.fromEntries(changed);
    } else if (!same(before, value)) {
      changes[key] = value;
    }
  }

  return changes as Partial<DnD5eCharacter>;
}
