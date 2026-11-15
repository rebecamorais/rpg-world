import { useId } from 'react';

import { ART, type ArtName } from './art';
import styles from './effects.module.css';

/**
 * How a drawing fits the card. By default it is a banner on the card's top edge (cut to the
 * card's width). Some cover the whole card, stretched (textures: waves, cracks, cuts), and an
 * object that must keep its shape (the necrotic skull) fills the card's height on the right.
 * The ones that fill the height also take `height: 100%` in effects.module.css.
 */
const FIT: Partial<Record<ArtName, string>> = {
  'acid-bubbles': 'none',
  'impact-fractures': 'none',
  'lightning-branches': 'none',
  'piercing-needle-thrusts': 'none',
  'slashing-slash-marks': 'none',
  'thunder-soundwaves': 'none',
  'necrotic-stag-skull': 'xMaxYMid meet',
};

/**
 * An effect drawing (the owner's static SVGs, converted by scripts/grimoire-svg-effect.ts): its
 * colours are tones of the host's tint and its fade is CSS. The markup is our own generated
 * constant, never user content; the prefix keeps each card's gradient ids unique.
 */
export function EffectArt({ name }: { name: ArtName }) {
  const prefix = useId().replace(/[^\w-]/g, '');
  const { viewBox, markup } = ART[name];
  return (
    <svg
      className={styles.art}
      data-art={name}
      viewBox={viewBox}
      preserveAspectRatio={FIT[name] ?? 'xMaxYMin slice'}
      fill="none"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup.replaceAll('__ID__', prefix) }}
    />
  );
}
