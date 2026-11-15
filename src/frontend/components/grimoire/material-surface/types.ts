import type { ReactNode } from 'react';

/** The material surfaces being explored for the Grimoire (see docs/grimoire-enchantments). */
export const MATERIAL_IDS = [
  'glacial-glass',
  'alchemical-corrosion',
  'crypt-stone',
  'divine-parchment',
] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];

/**
 * What a card needs to wear a material. The card places the layers itself, so it never imports
 * the material styles: a card without a material ships none of them.
 */
export interface CardMaterial {
  id: MaterialId;
  /** Color, texture and light. Goes inside the card's clip, under everything else. */
  surface: ReactNode;
  /**
   * Frost, cracks, drips, gilding. Decorative only (aria-hidden, no pointer events). It may
   * reach past the card's edge where the host allows it (the future OverflowBorders).
   */
  ornament: ReactNode;
}
