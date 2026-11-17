import type { ReactNode } from 'react';

/**
 * How an effect is built: `fx` is a CSS motif (gradients and masks in effects.module.css), `art` is
 * one of the owner's drawings (art/, by effect id; scripts/grimoire-svg-effect.ts converts them).
 */
type Parts = 'fx' | 'art';
/** The entrance accent, played once when the card opens. */
type Enter = 'fade' | 'grow' | 'spin';
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
  // Necrotic: a stag skull with mirrored antlers, keeping its shape on the right (the owner's drawing)
  'necrotic-stag-skull': { parts: 'art', enter: 'fade', ripple: ['smoke', 2] },
  // Radiant: sun rays fanning from just above the top edge, fading before the rules text
  sunburst: { parts: 'fx', enter: 'fade', ripple: ['glow', 3] },
  // Psychic: thought-wave contours around a focal point on the right (the owner's drawing)
  resonance: { parts: 'art', enter: 'fade', ripple: ['dashed', 3] },
  // Force: fine floating trails and energy points on the right, static
  'arcane-paths': { parts: 'art', enter: 'fade', ripple: ['thick', 2] },
  // Bludgeoning: cracks radiating from a point of impact, with facets and chips (the owner's drawing)
  'impact-fractures': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Acid: an acid film on top, a corrosive pool blooming from the bottom right, bubbles (the owner's drawing, v4)
  'acid-bloom': { parts: 'art', enter: 'fade', ripple: ['splash', 3] },
  // Cold: faceted ice glass and a six-armed crystal on the right (the owner's drawing)
  'frost-crystals': { parts: 'art', enter: 'fade', ripple: ['diamond', 2] },
  // Lightning: a forked bolt with branches from the top right corner (the owner's drawing)
  'lightning-branches': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Piercing: needle-thin thrusts converging on the right, with spear tips (the owner's drawing)
  'piercing-needle-thrusts': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Poison: organic mist, branching filaments, drops and spores, top right (the owner's drawing)
  'toxic-mist-filaments': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Thunder: pressure waves bending from the top toward the bottom right (the owner's drawing)
  'thunder-soundwaves': { parts: 'art', enter: 'fade', ripple: ['thick', 3] },
  // Slashing: three blade cuts with trailing winds, nicks and splinters (the owner's drawing)
  'slashing-slash-marks': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Abjuration: an aegis with interlocked wards and a sealed core (the owner's emblem)
  'abjuration-aegis-ward': { parts: 'art', enter: 'fade', ripple: ['diamond', 2] },
  // Conjuration: a gothic threshold gate with a folded crystal crossing it (the owner's emblem)
  'conjuration-threshold-gate': { parts: 'art', enter: 'fade', ripple: ['glow', 2] },
  // Divination: a clairvoyant eye in an open astrolabe, with constellations (the owner's emblem)
  'divination-astral-sight': { parts: 'art', enter: 'fade', ripple: ['glow', 2] },
  // Enchantment: interlaced charm ribbons locked by a faceted gem (the owner's emblem)
  'enchantment-charmweave': { parts: 'art', enter: 'fade', ripple: ['dashed', 2] },
  // Evocation: an eight-pointed burst in a calibrated ring (the owner's emblem)
  'evocation-arcane-burst': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Transmutation: a polyhedron in alchemical rings, with fragments turning around it (the owner's emblem)
  'transmutation-metamorphosis': { parts: 'art', enter: 'fade', ripple: ['round', 2] },
  // Necromancy: a broken double ring around a bound rune (the owner's emblem)
  'necromancy-circle': { parts: 'art', enter: 'fade', ripple: ['smoke', 2] },
  // Illusion: a veiled diamond mirrored in shifting outlines (the owner's emblem)
  'illusion-mirage-veil': { parts: 'art', enter: 'fade', ripple: ['dashed', 2] },
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
