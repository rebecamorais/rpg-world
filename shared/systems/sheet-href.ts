import { DEFAULT_SYSTEM, parseSystemId } from './registry';

export type SheetTab = 'lore' | 'spells' | 'inventory' | 'appearance';

/**
 * Address of a character sheet. Takes any string on purpose: it normalizes
 * old spellings (`DnD_5e`, `dnd_5e`) and falls back to the default system, so
 * a stale value never produces a broken link.
 */
export function sheetHref(system: string, characterId: string, tab?: SheetTab): string {
  const id = parseSystemId(system) ?? DEFAULT_SYSTEM;
  return `/system/${id}/character/${characterId}${tab ? `/${tab}` : ''}`;
}
