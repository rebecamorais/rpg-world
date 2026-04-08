/**
 * Converts a hex color string to HSL (Hue, Saturation, Lightness).
 * @param hex - The hex color string (e.g., "#663399")
 * @returns An object with h, s, and l values.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Ensure it's a valid hex string
  const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
  if (!hexPattern.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  // Remove the hash if it exists
  const cleanHex = hex.replace(/^#/, '');

  // Expand 3-digit hex to 6-digit
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  // Parse r, g, b
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
