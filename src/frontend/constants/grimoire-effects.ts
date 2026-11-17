import type { BorderHover, BorderOpening } from '@frontend/components/grimoire/card-border/types';
import { ART, type ArtName } from '@frontend/components/grimoire/card-effect/art';
import type { EffectId } from '@frontend/components/grimoire/card-effect/types';

/*
 * D&D 5e: which Grimoire effect an open spell card wears. The library knows nothing about
 * spells; this map is the game system's side, used by the spellbook and the lab (/dev/grimoire).
 * Every damage type and every school has one, so every spell gets an effect.
 */

/**
 * The Grimoire on the spellbook's cards. Rollback without touching data: set
 * NEXT_PUBLIC_GRIMOIRE_SPELLBOOK=off and rebuild (on Vercel, the project's env and a redeploy), and
 * every spell card is exactly today's again.
 */
export const GRIMOIRE_IN_SPELLBOOK = process.env.NEXT_PUBLIC_GRIMOIRE_SPELLBOOK !== 'off';

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
  transmutation: 'transmutation-metamorphosis',
  abjuration: 'abjuration-aegis-ward',
  conjuration: 'conjuration-threshold-gate',
  divination: 'divination-astral-sight',
  enchantment: 'enchantment-charmweave',
  illusion: 'illusion-mirage-veil',
  evocation: 'evocation-arcane-burst',
  necromancy: 'necromancy-circle',
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

/**
 * A spell's school emblem (lab: the header icon). The school effects are the owner's emblems, so
 * the emblem is the school's effect drawing; null when the school has none.
 */
export function spellEmblemOf(spell: { school?: string | null }): ArtName | null {
  const id = BY_SCHOOL[spell.school?.toLowerCase() ?? ''];
  return id && id in ART ? (id as ArtName) : null;
}

/**
 * The spell card's border effects (owner's choice, 17/11): the ring of light on hover and the
 * light that turns once around the border on open, which read as one gesture. The library's other
 * border effects (shine, turn, beam, corners) stay as options for other places.
 */
export const SPELL_CARD_BORDER: { hover: BorderHover; opening: BorderOpening } = {
  hover: 'glow',
  opening: 'spin',
};
