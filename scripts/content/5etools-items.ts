import { contentIdFromName } from '@shared/content/content-key';
import type { ItemCategory, ItemData, ItemText } from '@shared/systems/dnd5e/content/item.schema';

import { type Entry, renderEntries } from './5etools-spells';

/*
 * Converts 5etools items (data/items-base.json and items.json) to the content format.
 * Only the fields the conversion reads are typed.
 */

export interface FiveToolsItem {
  name: string;
  source: string;
  /** The SRD 5.2 item (on the 2024 book's). */
  srd52?: boolean;
  /** The SRD 5.1 item (on the 2014 book's). */
  srd?: boolean;
  /** `none` or missing for mundane items. */
  rarity?: string;
  /** Item type code, with the source after a `|` in the 2024 book, e.g. `HA|XPHB`. */
  type?: string;
  /** In copper pieces. */
  value?: number;
  /** In pounds. */
  weight?: number;
  ac?: number;
  /** A number written as text, e.g. `"15"`. */
  strength?: string;
  stealth?: boolean;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  /** A code, or an object with the code in `uid` (e.g. the Lance's two-handed note). */
  property?: (string | { uid: string })[];
  range?: string;
  packContents?: unknown[];
  entries?: Entry[];
}

/** The SRD books the items are imported for: content folder -> 5etools source and SRD flag. */
const BOOKS = {
  'srd-5.1': { source: 'PHB', flag: 'srd' },
  'srd-5.2': { source: 'XPHB', flag: 'srd52' },
} as const;

export type ItemBook = keyof typeof BOOKS;

const CATEGORY_BY_TYPE: Record<string, ItemCategory> = {
  M: 'weapon',
  R: 'weapon',
  LA: 'armor',
  MA: 'armor',
  HA: 'armor',
  S: 'shield',
  A: 'ammunition',
  AF: 'ammunition',
  AT: 'tool',
  GS: 'tool',
  T: 'tool',
  INS: 'instrument',
  SCF: 'focus',
  MNT: 'mount',
  TAH: 'mount',
  VEH: 'vehicle',
  SHP: 'vehicle',
  AIR: 'vehicle',
  FD: 'food',
  TG: 'trade-good',
  $: 'trade-good',
  G: 'gear',
};

const DAMAGE_TYPES: Record<string, string> = { B: 'bludgeoning', P: 'piercing', S: 'slashing' };

/** Drops the source after the `|` of a code, e.g. `V|XPHB` -> `V`. */
const withoutSource = (code: string) => code.split('|')[0];

export const toItemId = (item: FiveToolsItem) => contentIdFromName(item.name);

export const isCommonSrdItem = (item: FiveToolsItem, book: ItemBook) => {
  const { source, flag } = BOOKS[book];
  return item.source === source && item[flag] === true && (item.rarity ?? 'none') === 'none';
};

function toCategory(item: FiveToolsItem): ItemCategory {
  if (!item.type) return 'gear';
  const type = withoutSource(item.type);
  if (type === 'G' && item.packContents) return 'kit';
  return CATEGORY_BY_TYPE[type] ?? 'other';
}

export function toItemData(item: FiveToolsItem): ItemData {
  const data: ItemData = { id: toItemId(item), category: toCategory(item) };
  if (item.value !== undefined) data.value = item.value;
  if (item.weight !== undefined) data.weight = item.weight;
  if (item.strength) data.strength = Number(item.strength);
  if (item.stealth) data.stealthDisadvantage = true;
  if (item.ac !== undefined) data.ac = item.ac;
  if (item.dmg1 && item.dmgType) {
    data.damage = { dice: item.dmg1, type: DAMAGE_TYPES[item.dmgType] ?? item.dmgType };
  }
  if (item.dmg2) data.versatile = item.dmg2;
  if (item.property?.length)
    data.properties = item.property.map((p) => withoutSource(typeof p === 'string' ? p : p.uid));
  if (item.range) data.range = item.range;
  return data;
}

export function toItemText(item: FiveToolsItem): ItemText {
  return item.entries?.length
    ? { name: item.name, description: renderEntries(item.entries) }
    : { name: item.name };
}
