import type { ReactNode } from 'react';

/** On a closed card, under the mouse (devices with a real hover only). */
export const BORDER_HOVERS = ['glow', 'shine', 'turn'] as const;
export type BorderHover = (typeof BORDER_HOVERS)[number];

/** Once, when the card opens. */
export const BORDER_OPENINGS = ['beam', 'spin', 'corners'] as const;
export type BorderOpening = (typeof BORDER_OPENINGS)[number];

/**
 * A card's border effects, as a host takes them: its class and data attributes, and the layers
 * that run when it opens. The open card always gets the still arcane border (decision 20).
 */
export interface CardBorder {
  className: string;
  hover: BorderHover | null;
  opening: BorderOpening | null;
  /** Rendered only while the card is open; empty without an opening effect */
  layers: () => ReactNode;
}
