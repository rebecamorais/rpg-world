import type { EffectId } from '@frontend/components/grimoire/card-effect/types';

/*
 * D&D 5e: which Grimoire effect an open spell card wears. Like the materials map, the library
 * knows nothing about spells; this map is an example used by the lab (/dev/grimoire)
 * only. Every damage type and every school has one, so every spell gets an effect.
 */

const BY_DAMAGE: Partial<Record<string, EffectId>> = {
  fire: 'embers',
  necrotic: 'grave-mist',
  radiant: 'sunburst',
  psychic: 'echo',
  force: 'arcane-paths',
  bludgeoning: 'impact',
  acid: 'drips',
  cold: 'frost',
  lightning: 'bolt',
  piercing: 'thrust',
  poison: 'miasma',
  thunder: 'soundwave',
  slashing: 'slashes',
};

const BY_SCHOOL: Partial<Record<string, EffectId>> = {
  transmutation: 'alchemy-circle',
  abjuration: 'ward-mesh',
  conjuration: 'portal',
  divination: 'star-map',
  enchantment: 'swirl',
  illusion: 'mirage',
  evocation: 'burst',
  necromancy: 'crypt-fog',
};

/** A spell's effect, by the same rule as its color: the damage type, else the school. */
export function spellEffectOf(spell: {
  damageType?: string | null;
  school?: string | null;
}): EffectId | null {
  return (
    BY_DAMAGE[spell.damageType?.toLowerCase() ?? ''] ??
    BY_SCHOOL[spell.school?.toLowerCase() ?? ''] ??
    null
  );
}
