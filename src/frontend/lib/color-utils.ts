import type { CSSProperties } from 'react';

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The character's accent color when it is a valid hex color (what the picker saves), otherwise
 * undefined. Anything else would turn `--character-color` invalid and blank every derived color.
 */
export function safeAccentColor(color?: string | null): string | undefined {
  return color && HEX_COLOR.test(color) ? color : undefined;
}

/**
 * Props that theme a subtree with the character's color. Use them on the sheet and on anything
 * rendered in a portal (dialogs, drawers), which sits outside the sheet's `.character-context`:
 * the derived tokens (-flare, -surface, -on...) are only recomputed under that class.
 */
export function characterTheme(color?: string | null): {
  className: string;
  style: CSSProperties;
} {
  return {
    className: 'character-context',
    style: { '--character-color': safeAccentColor(color) ?? 'var(--brand)' } as CSSProperties,
  };
}
