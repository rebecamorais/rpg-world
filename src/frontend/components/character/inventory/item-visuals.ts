import type { CSSProperties } from 'react';

import type { InventoryItem } from '@frontend/hooks/useInventory';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import type { ItemCategory } from '@shared/systems/dnd5e/content/item.schema';

export type ItemGroup = 'weapons' | 'armor' | 'magic' | 'tools' | 'gear' | 'other';

/** Backpack sections, in display order. */
export const ITEM_GROUPS: readonly ItemGroup[] = [
  'weapons',
  'armor',
  'magic',
  'tools',
  'gear',
  'other',
];

const GROUP_BY_CATEGORY: Record<ItemCategory, ItemGroup> = {
  weapon: 'weapons',
  ammunition: 'weapons',
  armor: 'armor',
  shield: 'armor',
  focus: 'magic',
  tool: 'tools',
  kit: 'tools',
  instrument: 'tools',
  gear: 'gear',
  food: 'gear',
  'trade-good': 'gear',
  mount: 'other',
  vehicle: 'other',
  other: 'other',
};

/** Group of an item category; `null` (item outside the catalog) is `other`. */
export function groupOf(category: ItemCategory | null): ItemGroup {
  return category ? GROUP_BY_CATEGORY[category] : 'other';
}

/** Splits entries into backpack sections: `ITEM_GROUPS` order, non-empty only, entries keep their order. */
export function groupEntries(
  entries: InventoryItem[],
): { group: ItemGroup; entries: InventoryItem[]; weight: number }[] {
  return ITEM_GROUPS.map((group) => {
    const inGroup = entries.filter((e) => groupOf(e.item?.category ?? null) === group);
    const weight = inGroup.reduce((sum, e) => sum + (e.item?.weight ?? 0) * e.quantity, 0);
    return { group, entries: inGroup, weight };
  }).filter((g) => g.entries.length > 0);
}

// Icon names are string literals on purpose: `npm run icons` builds the sprite from them.

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  weapon: 'broadsword',
  armor: 'breastplate',
  shield: 'checked-shield',
  gear: 'knapsack',
  tool: 'toolbox',
  kit: 'swap-bag',
  ammunition: 'arrow-cluster',
  focus: 'holy-symbol',
  instrument: 'pan-flute',
  mount: 'horse-head',
  vehicle: 'ship-wheel',
  food: 'bread',
  'trade-good': 'coins',
  other: 'chest',
};

/** Icon of an item outside the catalog (a custom item). */
export const UNKNOWN_ITEM_ICON = 'help';

/** Game icon per item id (without source). Items not listed use their category icon. */
export const ITEM_ICONS: Readonly<Record<string, string>> = {
  spellbook: 'spell-book',
  spyglass: 'spyglass',
  'ink-pen': 'quill-ink',
  rope: 'rope-coil',
  'hempen-rope-50-feet': 'rope-coil',
  'silk-rope-50-feet': 'rope-coil',
  torch: 'torch',
  rations: 'bread',
  'rations-1-day': 'bread',
  backpack: 'backpack',
  bedroll: 'sleeping-bag',
  tent: 'camping-tent',
  waterskin: 'water-flask',
  tinderbox: 'flint-spark',
  'component-pouch': 'swap-bag',
  'healer-s-kit': 'medical-pack',
  'thieves-tools': 'lockpicks',
  shield: 'checked-shield',
  dagger: 'plain-dagger',
  longsword: 'broadsword',
  shortsword: 'gladius',
  greatsword: 'sword-brandish',
  battleaxe: 'battle-axe',
  handaxe: 'axe-swing',
  mace: 'mace-head',
  quarterstaff: 'wizard-staff',
  longbow: 'bow-arrow',
  shortbow: 'pocket-bow',
  'light-crossbow': 'crossbow',
  'hand-crossbow': 'crossbow',
  'heavy-crossbow': 'crossbow',
  spear: 'spears',
  trident: 'trident',
  whip: 'whip',
  sling: 'sling',
  arrow: 'arrow-flights',
  'arrows-20': 'arrow-cluster',
  'plate-armor': 'breastplate',
  'chain-mail': 'chain-mail',
  'leather-armor': 'leather-armor',
  crystal: 'crystal-shine',
  orb: 'crystal-ball',
  wand: 'crystal-wand',
  staff: 'wizard-staff',
  'holy-water': 'holy-water',
  lute: 'lyre',
};

/** Game icon for an item: its own icon, else its category's, else the unknown-item icon. */
export function gameIconOf(item: Pick<ItemDto, 'id' | 'category'> | null): string {
  if (!item) return UNKNOWN_ITEM_ICON;
  return ITEM_ICONS[item.id] ?? CATEGORY_ICONS[item.category];
}

/** Sets the group colour that `.item-context` derives its flare/surface/muted from. */
export function itemGroupStyle(group: ItemGroup): CSSProperties {
  return { '--item-color': `var(--item-${group})` } as CSSProperties;
}
