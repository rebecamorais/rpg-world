// Pure model of the derived-color formulas in app/globals.css, so tests can
// sweep the color wheel. `-flare` = text/icon variant of a color; `-on` = text
// on top of a solid fill.

export type Rgb = { r: number; g: number; b: number }; // sRGB, 0-1
export type ThemeName = 'dark' | 'light';

/** Dark flare: lightness floor (the current value in globals.css, do not change). */
export const FLARE_MIN_L_DARK = 0.74;
/** Light flare: lightness ceiling (calibrated by the sweep test). */
export const FLARE_MAX_L_LIGHT = 0.42;
export const FLARE_MAX_C = 0.2;
/** `-on` picks black above this relative luminance (gamma 2.2), white otherwise. */
export const ON_LUMINANCE = 0.179;
/**
 * Slope of the `-on` step in CSS: clamp(0, (ON_LUMINANCE - Y) * ON_RAMP, 1). Steep enough that
 * no 8-bit color lands on the ramp (closest |Y - 0.179| is ~1.9e-9), so the result is always
 * pure black or pure white, never gray.
 */
export const ON_RAMP = 1e9;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function parseHex(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((ch) => ch + ch).join('');
  const n = parseInt(h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function toHex(c: Rgb): string {
  const part = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${part(c.r)}${part(c.g)}${part(c.b)}`;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function relativeLuminance(c: Rgb): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Alpha composition of `fg` at `alpha` over `bg`. */
export function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

type Oklch = { l: number; c: number; h: number };

export function toOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  const h = c < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

const EPS = 1e-6;

function oklchToLinear({ l, c, h }: Oklch) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    g: -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    b: -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  };
}

const inGamut = (v: { r: number; g: number; b: number }) =>
  [v.r, v.g, v.b].every((x) => x >= -EPS && x <= 1 + EPS);

/** Gamut mapping as in CSS Color 4: reduce chroma at fixed L and h until it fits sRGB. */
export function fromOklch(o: Oklch): Rgb {
  const l = clamp01(o.l);
  let lin = oklchToLinear({ ...o, l });
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = o.c;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h: o.h }))) lo = mid;
      else hi = mid;
    }
    lin = oklchToLinear({ l, c: lo, h: o.h });
  }
  // Clip the tiny residue
  return {
    r: fromLinear(clamp01(lin.r)),
    g: fromLinear(clamp01(lin.g)),
    b: fromLinear(clamp01(lin.b)),
  };
}

/** Text/icon variant of a color: lightness bounded per theme, chroma capped. */
export function flare(color: Rgb, theme: ThemeName): Rgb {
  const { l, c, h } = toOklch(color);
  const nextL = theme === 'dark' ? Math.max(l, FLARE_MIN_L_DARK) : Math.min(l, FLARE_MAX_L_LIGHT);
  return fromOklch({ l: nextL, c: Math.min(c, FLARE_MAX_C), h });
}

/** Text color on top of a solid fill, exactly as the CSS computes it (see ON_RAMP). */
export function onColor(color: Rgb): Rgb {
  const y = 0.2126 * color.r ** 2.2 + 0.7152 * color.g ** 2.2 + 0.0722 * color.b ** 2.2;
  const v = clamp01((ON_LUMINANCE - y) * ON_RAMP);
  return { r: v, g: v, b: v };
}

type SurfaceName = 'background' | 'card' | 'popover' | 'muted' | 'veilOverBlack' | 'veilOverWhite';

const BLACK = parseHex('#000000');
const WHITE = parseHex('#ffffff');

const surfaces = (bg: string, card: string, popover: string, muted: string) => {
  const background = parseHex(bg);
  return {
    background,
    card: parseHex(card),
    popover: parseHex(popover),
    muted: parseHex(muted),
    veilOverBlack: over(background, 0.85, BLACK),
    veilOverWhite: over(background, 0.85, WHITE),
  };
};

export const SURFACES: Record<ThemeName, Record<SurfaceName, Rgb>> = {
  dark: surfaces('#09090b', '#121214', '#141416', '#18181b'),
  light: surfaces('#fafafa', '#f4f4f5', '#ffffff', '#f4f4f5'),
};
