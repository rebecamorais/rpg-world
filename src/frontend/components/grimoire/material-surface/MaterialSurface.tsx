import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@frontend/lib/utils';

import styles from './materials.module.css';
import type { CardMaterial, MaterialId } from './types';

/**
 * The layers of a material, for any card that is `position: relative` with rounded corners:
 * the surface clipped to the card's corners (with `children` clipped along with it) and the
 * ornament, which is free to reach past the edge and never catches the pointer. The host sets
 * `--grimoire-tint` and puts its content after these layers, above them.
 */
export function MaterialLayers({
  material,
  children,
}: {
  material: MaterialId;
  /** Host decoration to clip with the surface (a color stripe, a background) */
  children?: ReactNode;
}) {
  return (
    <>
      <span aria-hidden="true" data-material-clip="" className={styles.clip}>
        <span className={styles.surface} data-material={material} />
        {children}
      </span>
      <span aria-hidden="true" className={styles.ornament} data-material={material} />
    </>
  );
}

/** A material for a card that has its own frame (see CardMaterial). */
export function cardMaterial(id: MaterialId): CardMaterial {
  return {
    id,
    layers: (clipped) => <MaterialLayers material={id}>{clipped}</MaterialLayers>,
  };
}

interface MaterialSurfaceProps {
  material: MaterialId;
  /** The color the material takes (any CSS color or var); the material's own hue if left out */
  tint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A ready-made panel made of a material: frame, layers and content. The outer box has no overflow
 * clip, so ornaments can project beyond it.
 */
export function MaterialSurface({ material, tint, children, className }: MaterialSurfaceProps) {
  const style = tint ? ({ '--grimoire-tint': tint } as CSSProperties) : undefined;
  return (
    <div className={cn(styles.panel, className)} data-material={material} style={style}>
      <MaterialLayers material={material} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
