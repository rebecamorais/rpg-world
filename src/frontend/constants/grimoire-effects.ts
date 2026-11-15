import type { EffectId } from '@frontend/components/grimoire/card-effect/types';

/*
 * D&D 5e: which Grimoire effect an open spell card wears. The library knows nothing about
 * spells; this map is an example used by the lab (/dev/grimoire)
 * only. Every damage type and every school has one, so every spell gets an effect.
 */

const BY_DAMAGE: Partial<Record<string, EffectId>> = {
  fire: 'flame-ribbons',
  necrotic: 'necrotic-stag-skull',
  radiant: 'sunburst',
  psychic: 'resonance',
  force: 'arcane-paths',
  bludgeoning: 'impact-fractures',
  acid: 'acid-bloom',
  cold: 'frost-crystals',
  lightning: 'lightning-branches',
  piercing: 'piercing-needle-thrusts',
  poison: 'toxic-mist-filaments',
  thunder: 'thunder-soundwaves',
  slashing: 'slashing-slash-marks',
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
