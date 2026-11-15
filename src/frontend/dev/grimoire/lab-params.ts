import {
  MATERIAL_IDS,
  MATERIAL_VARIANTS,
  type MaterialId,
  type MaterialVariant,
} from '@frontend/components/grimoire/material-surface/types';

export interface LabParams {
  /** null = the card as it is today (the baseline) */
  material: MaterialId | null;
  /** null = the original material */
  variant: MaterialVariant | null;
  count: number;
  /** Open the first card, to see the material under SpellVFX */
  expanded: boolean;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** ?material=crypt-stone&variant=webp&count=100&expanded=1 — fixed URLs, so the benchmark can name each scenario. */
export function parseLabParams(query: Record<string, string | string[] | undefined>): LabParams {
  const material = one(query.material);
  const variant = one(query.variant);
  const count = Number(one(query.count));
  return {
    material: (MATERIAL_IDS as readonly string[]).includes(material ?? '')
      ? (material as MaterialId)
      : null,
    variant: (MATERIAL_VARIANTS as readonly string[]).includes(variant ?? '')
      ? (variant as MaterialVariant)
      : null,
    count: Number.isInteger(count) && count > 0 ? Math.min(count, 100) : 24,
    expanded: one(query.expanded) === '1',
  };
}
