import {
  MATERIAL_IDS,
  type MaterialId,
} from '@frontend/components/grimoire/material-surface/types';

export interface LabParams {
  /** null = the card as it is today (the baseline) */
  material: MaterialId | null;
  count: number;
  /** Open the first card, to see the material under SpellVFX */
  expanded: boolean;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** ?material=crypt-stone&count=100&expanded=1 — fixed URLs, so the benchmark can name each scenario. */
export function parseLabParams(query: Record<string, string | string[] | undefined>): LabParams {
  const material = one(query.material);
  const count = Number(one(query.count));
  return {
    material: (MATERIAL_IDS as readonly string[]).includes(material ?? '')
      ? (material as MaterialId)
      : null,
    count: Number.isInteger(count) && count > 0 ? Math.min(count, 100) : 24,
    expanded: one(query.expanded) === '1',
  };
}
