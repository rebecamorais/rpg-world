import type { ReactNode } from 'react';

import { cn } from '@frontend/lib/utils';

import styles from './materials.module.css';
import type { CardMaterial, MaterialId, MaterialVariant } from './types';

/** The two painted layers of a material, ready for a card that already has its own frame. */
export function cardMaterial(id: MaterialId, variant?: MaterialVariant): CardMaterial {
  return {
    id,
    variant,
    surface: (
      <span
        aria-hidden="true"
        className={styles.surface}
        data-material={id}
        data-variant={variant}
      />
    ),
    ornament: (
      <span
        aria-hidden="true"
        className={styles.ornament}
        data-material={id}
        data-variant={variant}
      />
    ),
  };
}

interface MaterialSurfaceProps {
  material: MaterialId;
  variant?: MaterialVariant;
  children: ReactNode;
  className?: string;
}

/**
 * A panel made of a material, in three layers: the surface (clipped to the rounded corners),
 * the ornament (free to reach past the edge, never catching the pointer) and the content.
 * The outer box has no overflow clip, so ornaments can project beyond it.
 */
export function MaterialSurface({ material, variant, children, className }: MaterialSurfaceProps) {
  return (
    <div className={cn(styles.panel, className)} data-material={material}>
      <span aria-hidden="true" className={styles.clip}>
        <span className={styles.surface} data-material={material} data-variant={variant} />
      </span>
      <span
        aria-hidden="true"
        className={styles.ornament}
        data-material={material}
        data-variant={variant}
      />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
