import type { CSSProperties, ReactNode } from 'react';

import { cardBorder } from '@frontend/components/grimoire/card-border/CardBorder';
import type { CardBorder } from '@frontend/components/grimoire/card-border/types';
import { cardEffect } from '@frontend/components/grimoire/card-effect/CardEffect';
import {
  type CardEffect,
  EFFECT_IDS,
  type EffectId,
} from '@frontend/components/grimoire/card-effect/types';
import { SCHOOL_THEMES } from '@frontend/constants/damage-themes';
import {
  GRIMOIRE_IN_SPELLBOOK,
  SPELL_CARD_BORDER,
  spellEffectOf,
} from '@frontend/constants/grimoire-effects';

/*
 * The Grimoire on the real spell cards (spellbook and spell search): the open card's effect, the
 * school emblem in the header and the border effects. Everything is built once, at module level:
 * the same objects on every render keep SpellCard's memo working.
 */

const EFFECTS = Object.fromEntries(EFFECT_IDS.map((id) => [id, cardEffect(id)])) as Record<
  EffectId,
  CardEffect
>;

const BORDER = cardBorder(SPELL_CARD_BORDER.hover, SPELL_CARD_BORDER.opening);

/**
 * The owner's school emblems (public/grimoire/emblems, 96px WebP) as a mask, painted in the
 * header's colour (text-spell-flare: the spell colour, lighter on dark, deeper on light). Each image
 * is decoded once and shared by every card of its school. In forced colors the box keeps the
 * system text colour, as the game icon did.
 */
const SCHOOL_EMBLEMS = Object.fromEntries(
  Object.keys(SCHOOL_THEMES).map((school) => [
    school,
    <span
      key={school}
      data-school-emblem={school}
      className="block size-full bg-current mask-(--school-emblem) mask-contain mask-center mask-no-repeat forced-colors:bg-[CanvasText] forced-colors:forced-color-adjust-none"
      // Only the image's address is inline; the mask itself comes from Tailwind, whose production
      // build adds the -webkit- prefix Chrome and Edge 111-119 (in Next's browser targets) need.
      // The dev build doesn't prefix, so on those browsers the emblem is a solid square in dev only
      style={{ '--school-emblem': `url(/grimoire/emblems/${school}.webp)` } as CSSProperties}
    />,
  ]),
) as Record<string, ReactNode>;

/** A school's emblem for the card header, or undefined when the school has none. */
export function schoolEmblemOf(school: string | null | undefined): ReactNode | undefined {
  return SCHOOL_EMBLEMS[school?.toLowerCase() ?? ''];
}

export interface SpellGrimoire {
  effect?: CardEffect;
  icon?: ReactNode;
  border?: CardBorder;
}

const TODAY: SpellGrimoire = {};

/**
 * What a spell card wears from the Grimoire, to spread on <SpellCard>: the effect by the damage
 * type, else the school (decision 27/28); the school emblem in the header on every spell
 * (decision 30); the ring of light and the light spin (decision 29). With the Grimoire off, nothing:
 * the card is exactly today's.
 */
export function spellGrimoireOf(
  spell: { damageType?: string | null; school?: string | null },
  enabled: boolean = GRIMOIRE_IN_SPELLBOOK,
): SpellGrimoire {
  if (!enabled) return TODAY;
  const effect = spellEffectOf(spell);
  return {
    effect: effect ? EFFECTS[effect] : undefined,
    icon: schoolEmblemOf(spell.school),
    border: BORDER,
  };
}
