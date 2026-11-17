import styles from './border.module.css';
import type { BorderHover, BorderOpening, CardBorder } from './types';

/** The opening effect: on the border's ring only (beam, spin) or at its corners. Runs once. */
export function BorderOpeningLayer({ kind }: { kind: BorderOpening }) {
  if (kind === 'corners') {
    return (
      <span aria-hidden="true" className={styles.corners} data-opening={kind}>
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={styles.ring} data-opening={kind}>
      <span className={styles[kind]} />
    </span>
  );
}

/**
 * Border effects for any card. The host spreads `className`, sets `data-border-hover={hover}`,
 * `data-border-open` while open and `--grimoire-tint`, and renders `layers()` while open. Build
 * once per pair (a stable object keeps memoised cards from re-rendering).
 */
export function cardBorder(hover: BorderHover | null, opening: BorderOpening | null): CardBorder {
  return {
    className: styles.host,
    hover,
    opening,
    layers: () => opening && <BorderOpeningLayer kind={opening} />,
  };
}
