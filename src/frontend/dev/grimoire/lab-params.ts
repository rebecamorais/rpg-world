import { EFFECT_IDS, type EffectId } from '@frontend/components/grimoire/card-effect/types';

export interface LabParams {
  /** The open card's effect: null = today's background; 'auto' = each spell by the D&D map */
  effect: EffectId | 'auto' | null;
  count: number;
  /**
   * The header icon: 'emblem' = the school emblem as SVG, in the spell colour; 'webp' = the owner's
   * emblem images (96px, fixed colours); null = the game icon
   */
  icons: 'emblem' | 'webp' | null;
  /** Open the first card */
  expanded: boolean;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** ?effect=auto&count=100&expanded=1 — fixed URLs, so the benchmark can name each scenario. */
export function parseLabParams(query: Record<string, string | string[] | undefined>): LabParams {
  const effect = one(query.effect);
  const count = Number(one(query.count));
  return {
    effect:
      effect === 'auto'
        ? 'auto'
        : (EFFECT_IDS as readonly string[]).includes(effect ?? '')
          ? (effect as EffectId)
          : null,
    count: Number.isInteger(count) && count > 0 ? Math.min(count, 100) : 24,
    icons:
      one(query.icons) === 'emblem' || one(query.icons) === 'webp'
        ? (one(query.icons) as 'emblem' | 'webp')
        : null,
    expanded: one(query.expanded) === '1',
  };
}
