import { useId } from 'react';

import styles from './effects.module.css';

/*
 * Arcane paths (force): the geometry of the owner's "magic missile floating paths" drawing (a
 * 740x168 card banner, after the Floating Paths idea), redrawn in the host's tint instead of fixed
 * purple and cyan. Fine curved trails, three energy trails ending in energy points, and dust; the
 * light sits on the right so it never competes with the title. Static, like the owner's static
 * version: it only fades in with the card.
 */

/** [path, tone 0–3, stroke width, opacity] */
const TRAILS: [string, number, number, number][] = [
  ['M 260.0 113.7 C 414.0 79.6 527.0 -27.5 790.0 -30.0', 0, 0.4, 0.3],
  ['M 262.6 118.8 C 415.2 83.5 527.4 -24.5 790.0 -23.2', 1, 0.51, 0.25],
  ['M 265.2 123.8 C 416.4 87.3 527.8 -21.5 790.0 -16.4', 2, 0.61, 0.17],
  ['M 267.8 128.9 C 417.6 91.2 528.2 -18.5 790.0 -9.6', 3, 0.72, 0.16],
  ['M 270.4 133.9 C 418.8 95.2 528.6 -15.5 790.0 -2.8', 0, 0.82, 0.23],
  ['M 273.0 139.0 C 420.0 99.1 529.0 -12.5 790.0 4.0', 1, 0.93, 0.3],
  ['M 275.6 144.0 C 421.2 103.0 529.4 -9.5 790.0 10.8', 2, 1.03, 0.27],
  ['M 278.2 149.1 C 422.4 106.8 529.8 -6.5 790.0 17.6', 3, 0.4, 0.18],
  ['M 280.8 154.1 C 423.6 110.8 530.2 -3.5 790.0 24.4', 0, 0.51, 0.15],
  ['M 283.4 159.2 C 424.8 114.7 530.6 -0.5 790.0 31.2', 1, 0.61, 0.22],
  ['M 286.0 164.2 C 426.0 118.5 531.0 2.5 790.0 38.0', 2, 0.72, 0.29],
  ['M 288.6 169.3 C 427.2 122.5 531.4 5.5 790.0 44.8', 3, 0.82, 0.28],
  ['M 291.2 174.3 C 428.4 126.3 531.8 8.5 790.0 51.6', 0, 0.93, 0.2],
  ['M 293.8 179.4 C 429.6 130.2 532.2 11.5 790.0 58.4', 1, 1.03, 0.15],
  ['M 296.4 184.4 C 430.8 134.2 532.6 14.5 790.0 65.2', 2, 0.4, 0.2],
  ['M 299.0 189.5 C 432.0 138.1 533.0 17.5 790.0 72.0', 3, 0.51, 0.28],
  ['M 301.6 194.5 C 433.2 141.9 533.4 20.5 790.0 78.8', 0, 0.61, 0.29],
  ['M 304.2 199.6 C 434.4 145.8 533.8 23.5 790.0 85.6', 1, 0.72, 0.21],
  ['M 306.8 204.6 C 435.6 149.8 534.2 26.5 790.0 92.4', 2, 0.82, 0.15],
  ['M 309.4 209.7 C 436.8 153.7 534.6 29.5 790.0 99.2', 3, 0.93, 0.18],
  ['M 312.0 214.7 C 438.0 157.6 535.0 32.5 790.0 106.0', 0, 1.03, 0.27],
  ['M 314.6 219.8 C 439.2 161.4 535.4 35.5 790.0 112.8', 1, 0.4, 0.3],
  ['M 317.2 224.8 C 440.4 165.3 535.8 38.5 790.0 119.6', 2, 0.51, 0.23],
  ['M 319.8 229.9 C 441.6 169.2 536.2 41.5 790.0 126.4', 3, 0.61, 0.16],
  ['M 322.4 234.9 C 442.8 173.2 536.6 44.5 790.0 133.2', 0, 0.72, 0.17],
  ['M 325.0 240.0 C 444.0 177.1 537.0 47.5 790.0 140.0', 1, 0.82, 0.25],
  ['M 327.6 245.0 C 445.2 180.9 537.4 50.5 790.0 146.8', 2, 0.93, 0.3],
  ['M 330.2 250.1 C 446.4 184.8 537.8 53.5 790.0 153.6', 3, 1.03, 0.25],
  ['M 332.8 255.1 C 447.6 188.8 538.2 56.5 790.0 160.4', 0, 0.4, 0.17],
  ['M 335.4 260.2 C 448.8 192.7 538.6 59.5 790.0 167.2', 1, 0.51, 0.16],
  ['M 338.0 265.2 C 450.0 196.6 539.0 62.5 790.0 174.0', 2, 0.61, 0.24],
  ['M 340.6 270.3 C 451.2 200.4 539.4 65.5 790.0 180.8', 3, 0.72, 0.3],
];

const ENERGY = [
  { d: 'M 286 145 C 420 139 470 54 642 40', halo: 9.8, trail: 1.85, flow: 1.09 },
  { d: 'M 343 139 C 479 95 569 102 697 84', halo: 8.48, trail: 1.6, flow: 0.94 },
  { d: 'M 300 180 C 426 158 505 155 603 134', halo: 8.21, trail: 1.55, flow: 0.91 },
];

/** Energy points: [x, y, glow radius] */
const POINTS: [number, number, number][] = [
  [642, 40, 37.4],
  [697, 84, 32.6],
  [603, 134, 33.6],
];

/** Dust: [x, y, r, opacity] */
const DUST: [number, number, number, number][] = [
  [508, 32, 1.1, 0.22],
  [561, 52, 0.8, 0.32],
  [718, 21, 0.7, 0.42],
  [577, 9, 0.9, 0.52],
  [673, 119, 0.8, 0.22],
  [730, 139, 0.7, 0.32],
  [514, 118, 0.8, 0.42],
  [619, 102, 0.9, 0.52],
  [462, 61, 0.65, 0.22],
  [542, 154, 0.72, 0.32],
  [641, 155, 0.5, 0.42],
];

const TONE = [styles.tone0, styles.tone1, styles.tone2, styles.tone3];

export function ArcanePaths() {
  // Gradient ids must be unique per card
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={styles.paths}
      viewBox="0 0 740 168"
      preserveAspectRatio="xMaxYMin slice"
      fill="none"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`${id}t`}
          x1="380"
          y1="155"
          x2="725"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" className={styles.stop0} stopOpacity="0" />
          <stop offset="0.35" className={styles.stop1} stopOpacity="0.25" />
          <stop offset="0.82" className={styles.stop2} stopOpacity="0.95" />
          <stop offset="1" className={styles.stop3} stopOpacity="0.65" />
        </linearGradient>
        <radialGradient id={`${id}g`}>
          <stop offset="0" className={styles.stop2} stopOpacity="0.85" />
          <stop offset="0.2" className={styles.stop1} stopOpacity="0.52" />
          <stop offset="0.6" className={styles.stop0} stopOpacity="0.13" />
          <stop offset="1" className={styles.stop0} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}c`}>
          <stop offset="0" className={styles.stop3} stopOpacity="1" />
          <stop offset="0.2" className={styles.stop3} stopOpacity="0.66" />
          <stop offset="0.6" className={styles.stop1} stopOpacity="0.13" />
          <stop offset="1" className={styles.stop1} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="590" cy="57" rx="235" ry="105" fill={`url(#${id}g)`} opacity="0.23" />
      <ellipse cx="705" cy="18" rx="122" ry="82" fill={`url(#${id}c)`} opacity="0.12" />
      {TRAILS.map(([d, tone, width, opacity]) => (
        <path key={d} d={d} className={TONE[tone]} strokeWidth={width} opacity={opacity} />
      ))}
      {ENERGY.map(({ d, halo, trail, flow }) => (
        <g key={d}>
          <path d={d} className={styles.tone0} strokeWidth={halo} opacity="0.065" />
          <path
            d={d}
            stroke={`url(#${id}t)`}
            strokeWidth={trail}
            strokeLinecap="round"
            opacity="0.73"
          />
          <path d={d} className={styles.flow} strokeWidth={flow} strokeLinecap="round" />
        </g>
      ))}
      {POINTS.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill={`url(#${id}g)`} opacity="0.68" />
          <circle cx={x} cy={y} r={r * 0.625} fill={`url(#${id}c)`} opacity="0.55" />
          <g>
            <path
              d={`M ${x - r * 0.26} ${y} H ${x + r * 0.26} M ${x} ${y - r * 0.26} V ${y + r * 0.26}`}
              className={styles.tone3}
              strokeWidth="0.82"
              strokeLinecap="round"
              opacity="0.71"
            />
            <circle cx={x} cy={y} r={r * 0.103} className={styles.fill3} opacity="0.86" />
            <circle cx={x} cy={y} r={r * 0.047} className={styles.core} />
          </g>
        </g>
      ))}
      {DUST.map(([x, y, r, opacity]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className={styles.fill2} opacity={opacity} />
      ))}
    </svg>
  );
}
