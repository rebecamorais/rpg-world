import { useId } from 'react';

import { ART, type ArtName } from './art';
import styles from './effects.module.css';

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
      preserveAspectRatio="xMaxYMin slice"
      fill="none"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup.replaceAll('__ID__', prefix) }}
    />
  );
}
