import { EFFECT_IDS, type EffectId } from '@frontend/components/grimoire/card-effect/types';
import {
  MATERIAL_IDS,
  type MaterialId,
} from '@frontend/components/grimoire/material-surface/types';

export interface LabParams {
  /** null = the card as it is today (the baseline); 'auto' = each spell by the D&D map */
  material: MaterialId | 'auto' | null;
  /** The open card's effect: null = today's background; 'auto' = each spell by the D&D map */
  effect: EffectId | 'auto' | null;
  count: number;
  /** Open the first card, to see the material under SpellVFX */
  expanded: boolean;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** ?material=crypt-stone&effect=auto&count=100&expanded=1 — fixed URLs, so the benchmark can name each scenario. */
export function parseLabParams(query: Record<string, string | string[] | undefined>): LabParams {
  const material = one(query.material);
  const effect = one(query.effect);
  const count = Number(one(query.count));
  return {
    material:
      material === 'auto'
        ? 'auto'
        : (MATERIAL_IDS as readonly string[]).includes(material ?? '')
          ? (material as MaterialId)
          : null,
    effect:
      effect === 'auto'
        ? 'auto'
        : (EFFECT_IDS as readonly string[]).includes(effect ?? '')
          ? (effect as EffectId)
          : null,
    count: Number.isInteger(count) && count > 0 ? Math.min(count, 100) : 24,
    expanded: one(query.expanded) === '1',
  };
}
