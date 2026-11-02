import type { CSSProperties } from 'react';

import type { Coin } from '@shared/systems/dnd5e';

/**
 * A coin, each metal with its own shape (public/coins/*.svg). Hovering a `group` around it lifts
 * the coin and sweeps a glint across it, cut to the coin's shape. Decorative: the coin's name
 * goes next to it.
 */
export function CoinIcon({ coin, size = 40 }: { coin: Coin; size?: number }) {
  const src = `/coins/${coin}.svg`;
  const shape = { maskImage: `url(${src})`, maskSize: 'contain', maskRepeat: 'no-repeat' };

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, '--coin-glow': `var(--coin-${coin})` } as CSSProperties}
      className="relative inline-block shrink-0 transition-[translate,filter] duration-300 group-hover:-translate-y-px group-hover:drop-shadow-[0_2px_6px_color-mix(in_oklch,var(--coin-glow),transparent_55%)] motion-reduce:transition-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a tiny static SVG, nothing to optimize */}
      <img src={src} alt="" width={size} height={size} className="block" />
      <span style={shape} className="absolute inset-0 overflow-hidden motion-reduce:hidden">
        <span className="via-foreground/50 absolute inset-0 -translate-x-full bg-linear-115 from-transparent from-35% to-transparent to-65% transition-transform duration-700 group-hover:translate-x-full" />
      </span>
    </span>
  );
}
