import type { ReactNode } from 'react';

/**
 * How an effect is built: `fx` is one gradient motif, `glow+icons` is a glow placed per effect
 * plus icon details (one big and faded, a few small), `fx+bolt` adds a lightning shape, `art` is
 * one of the owner's drawings (art/, by effect id; scripts/grimoire-svg-effect.ts converts them).
 */
type Parts = 'fx' | 'glow+icons' | 'fx+bolt' | 'art';
/** The entrance accent, played once when the card opens. */
type Enter = 'fade' | 'rise' | 'grow' | 'flash' | 'flicker' | 'spin';
type RippleShape = 'round' | 'diamond' | 'splash' | 'dashed' | 'thick' | 'glow' | 'smoke';

interface EffectSpec {
  parts: Parts;
  enter: Enter;
  /** Ring shape and how many rings (staggered) per ripple. */
  ripple: [RippleShape, number];
}

/**
 * The effect catalog. Ids name a motif, not a game rule: which content wears which effect is a
 * game system's map (D&D 5e: src/frontend/constants/grimoire-effects.ts).
 */
export const EFFECTS = {
  // Fire: curved, pointed flame ribbons, heat trails and sparks on the right (the owner's drawing)
  'flame-ribbons': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  embers: { parts: 'fx', enter: 'rise', ripple: ['round', 2] },
  'grave-mist': { parts: 'glow+icons', enter: 'fade', ripple: ['smoke', 2] },
  sunlight: { parts: 'glow+icons', enter: 'fade', ripple: ['glow', 3] },
  // Radiant: sun rays fanning from just above the top edge, fading before the rules text
  sunburst: { parts: 'fx', enter: 'fade', ripple: ['glow', 3] },
  // Psychic: thought-wave contours around a focal point on the right (the owner's drawing)
  resonance: { parts: 'art', enter: 'fade', ripple: ['dashed', 3] },
  echo: { parts: 'fx', enter: 'grow', ripple: ['dashed', 3] },
  // Force: fine floating trails and energy points on the right, static
  'arcane-paths': { parts: 'art', enter: 'fade', ripple: ['thick', 2] },
  shockwave: { parts: 'fx', enter: 'grow', ripple: ['thick', 2] },
  impact: { parts: 'fx', enter: 'flash', ripple: ['round', 2] },
  drips: { parts: 'glow+icons', enter: 'fade', ripple: ['splash', 3] },
  frost: { parts: 'glow+icons', enter: 'fade', ripple: ['diamond', 2] },
  bolt: { parts: 'fx+bolt', enter: 'flicker', ripple: ['round', 2] },
  thrust: { parts: 'fx', enter: 'flash', ripple: ['round', 2] },
  miasma: { parts: 'fx', enter: 'rise', ripple: ['round', 2] },
  soundwave: { parts: 'fx', enter: 'grow', ripple: ['thick', 3] },
  slashes: { parts: 'fx', enter: 'flash', ripple: ['round', 2] },
  'alchemy-circle': { parts: 'fx', enter: 'spin', ripple: ['round', 2] },
  'ward-mesh': { parts: 'fx', enter: 'fade', ripple: ['diamond', 2] },
  portal: { parts: 'fx', enter: 'grow', ripple: ['glow', 2] },
  'star-map': { parts: 'fx', enter: 'fade', ripple: ['glow', 2] },
  swirl: { parts: 'fx', enter: 'spin', ripple: ['dashed', 2] },
  mirage: { parts: 'fx', enter: 'fade', ripple: ['dashed', 2] },
  burst: { parts: 'fx', enter: 'grow', ripple: ['round', 2] },
  'crypt-fog': { parts: 'fx', enter: 'fade', ripple: ['smoke', 2] },
} as const satisfies Record<string, EffectSpec>;

export type EffectId = keyof typeof EFFECTS;
export const EFFECT_IDS = Object.keys(EFFECTS) as EffectId[];

/**
 * An open-card effect, ready for a card. The host must be `position: relative` with rounded
 * corners, set `--grimoire-tint` to its own color and `data-grimoire-host` (so taps on it send
 * ripples), and render `layers()` only while the card is open, inside its clip. An element marked
 * `data-grimoire-origin` (the card's icon) is where the opening ripple starts.
 */
export interface CardEffect {
  id: EffectId;
  layers: () => ReactNode;
}
