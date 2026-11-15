'use client';

import { useEffect, useRef } from 'react';

import { ArcanePaths } from './ArcanePaths';
import styles from './effects.module.css';
import { type CardEffect, EFFECTS, type EffectId } from './types';

/**
 * An effect's layers for an open card: the motif, its entrance (once, on mount) and ripples
 * (one from the card's icon on open, then one from each tap on the host). Any card can use it.
 */
export function EffectLayers({ effect }: { effect: EffectId }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { parts, enter, ripple } = EFFECTS[effect];
  const [shape, rings] = ripple;

  useEffect(() => {
    const layer = ref.current;
    const host = layer?.closest<HTMLElement>('[data-grimoire-host]');
    if (!layer || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const spawned = new Set<HTMLElement>();
    const send = (clientX: number, clientY: number) => {
      const box = layer.getBoundingClientRect();
      for (let i = 0; i < rings; i++) {
        const ring = document.createElement('span');
        ring.className = styles.ripple;
        ring.dataset.shape = shape;
        ring.style.setProperty('--rx', `${clientX - box.left}px`);
        ring.style.setProperty('--ry', `${clientY - box.top}px`);
        ring.style.setProperty('--rdl', `${i * 0.14}s`);
        ring.addEventListener('animationend', () => {
          ring.remove();
          spawned.delete(ring);
        });
        spawned.add(ring);
        layer.append(ring);
      }
    };

    const origin = host.querySelector('[data-grimoire-origin]')?.getBoundingClientRect();
    if (origin) send(origin.left + origin.width / 2, origin.top + origin.height / 2);

    const onTap = (event: PointerEvent) => send(event.clientX, event.clientY);
    host.addEventListener('pointerdown', onTap);
    return () => {
      host.removeEventListener('pointerdown', onTap);
      spawned.forEach((ring) => ring.remove());
    };
  }, [shape, rings]);

  return (
    <span ref={ref} aria-hidden="true" className={styles.layer} data-enter={enter}>
      {parts === 'paths' ? (
        <ArcanePaths />
      ) : parts === 'glow+icons' ? (
        <>
          <span className={styles.glow} data-effect={effect} />
          <span className={styles.deco} data-effect={effect} data-size="big" />
          <span className={styles.deco} data-effect={effect} data-size="small" />
        </>
      ) : (
        <span className={styles.fx} data-effect={effect} />
      )}
      {parts === 'fx+bolt' && <span className={styles.bolt} />}
      {enter === 'spin' && (
        <span className={styles.ring}>
          <span className={styles.spin} />
        </span>
      )}
    </span>
  );
}

/** The same layers in the shape a card takes as a prop. Build once per id (stable for memo). */
export function cardEffect(id: EffectId): CardEffect {
  return { id, layers: () => <EffectLayers effect={id} /> };
}
