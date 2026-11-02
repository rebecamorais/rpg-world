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

const CONTENT_KEY = /^dnd5e:([a-z0-9.-]+):([a-z]+):([a-z0-9-]+)$/;

const contentKey = (source: string, type: string, id: string) => `dnd5e:${source}:${type}:${id}`;

/** Kebab-case id of a content name: lowercase, runs of non `[a-z0-9]` become `-`, no edge dashes. */
export const contentIdFromName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const conditionKey = (source: string, id: string) => contentKey(source, 'condition', id);
export const itemKey = (source: string, id: string) => contentKey(source, 'item', id);

export function parseContentKey(key: string): { source: string; type: string; id: string } | null {
  const match = CONTENT_KEY.exec(key);
  return match ? { source: match[1], type: match[2], id: match[3] } : null;
}
