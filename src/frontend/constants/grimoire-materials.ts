import type { ItemGroup } from '@frontend/components/character/inventory/item-visuals';
import type { MaterialId } from '@frontend/components/grimoire/material-surface/types';

/*
 * D&D 5e: which Grimoire material a card wears. The material library knows nothing about game
 * systems; each system maps its own content here (another system gets its own map, the library
 * doesn't change). Example mappings, used by the lab (/dev/grimoire) for now: nothing
 * in the spellbook or the backpack reads them yet.
 */

const BY_DAMAGE: Partial<Record<string, MaterialId>> = {
  cold: 'glacial-glass',
  acid: 'alchemical-corrosion',
  poison: 'alchemical-corrosion',
  necrotic: 'crypt-stone',
  radiant: 'divine-parchment',
};

const BY_SCHOOL: Partial<Record<string, MaterialId>> = {
  abjuration: 'glacial-glass',
  transmutation: 'alchemical-corrosion',
  necromancy: 'crypt-stone',
  divination: 'divine-parchment',
};

/**
 * A spell's material, by the same rule as its color (useSpellDisplay): the damage type decides
 * when there is one, else the school. `null`: the card stays as it is.
 */
export function spellMaterialOf(spell: {
  damageType?: string | null;
  school?: string | null;
}): MaterialId | null {
  const damage = spell.damageType?.toLowerCase();
  if (damage) return BY_DAMAGE[damage] ?? null;
  return BY_SCHOOL[spell.school?.toLowerCase() ?? ''] ?? null;
}

/** A backpack item's material, by its group (the same group that gives it --item-color). */
export const ITEM_GROUP_MATERIALS: Record<ItemGroup, MaterialId | null> = {
  weapons: 'glacial-glass',
  armor: 'crypt-stone',
  magic: 'divine-parchment',
  tools: null,
  gear: null,
  other: null,
};
