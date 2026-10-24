/*
 * Stable key of a piece of rules content: `<system>:<source>:<type>:<id>`. The source is part of
 * the key, so the same spell from two books (SRD 5.1 and 5.2) is two entries.
 */

export const SPELL_KEY = /^dnd5e:([a-z0-9.-]+):spell:([a-z0-9-]+)$/;

export const spellKey = (source: string, id: string) => `dnd5e:${source}:spell:${id}`;

export function parseSpellKey(key: string): { source: string; id: string } | null {
  const match = SPELL_KEY.exec(key);
  return match ? { source: match[1], id: match[2] } : null;
}
