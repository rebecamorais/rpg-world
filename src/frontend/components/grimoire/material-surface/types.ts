import type { ReactNode } from 'react';

/** The material surfaces of the Grimoire library (see docs/grimoire-enchantments). */
export const MATERIAL_IDS = [
  'glacial-glass',
  'alchemical-corrosion',
  'crypt-stone',
  'divine-parchment',
] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];

/**
 * What a card needs to wear a material, whatever the card shows (a spell, an item, a character)
 * and whatever the game system. The card stays in charge of its own frame:
 *
 * - it must be `position: relative` with rounded corners (the material clips to them);
 * - it sets `--grimoire-tint` to its own color (e.g. `var(--spell-color)`);
 * - it calls `layers()` once, passing whatever else it wants clipped with the surface (a color
 *   stripe, a background); its content goes after, above the layers.
 *
 * The card never imports the material styles: a card without a material ships none of them.
 */
export interface CardMaterial {
  id: MaterialId;
  /** The material's layers: the clipped surface (with `clipped` inside it) and the ornament. */
  layers: (clipped?: ReactNode) => ReactNode;
}
