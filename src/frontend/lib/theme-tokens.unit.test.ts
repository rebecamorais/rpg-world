import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  FILL_MAX_L_LIGHT,
  FILL_MIN_L_DARK,
  FLARE_MAX_C,
  FLARE_MAX_L_LIGHT,
  FLARE_MIN_L_DARK,
  ON_LUMINANCE,
  ON_RAMP,
  SURFACES,
  type ThemeName,
  contrastRatio,
  fill,
  flare,
  over,
  parseHex,
  toHex,
} from './contrast';

const css = fs.readFileSync(path.resolve(import.meta.dirname, '../../../app/globals.css'), 'utf8');

/** Custom properties declared directly in the block that opens with `opener`. */
function block(opener: string): Record<string, string> {
  const start = css.indexOf(`\n${opener} {`);
  if (start === -1) return {};
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start));
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}

const dark = block(':root');
const tokens: Record<ThemeName, Record<string, string>> = {
  dark,
  light: { ...dark, ...block(":root[data-theme='light']") },
};

/** Resolves a token to a hex color, following var() aliases. */
function color(theme: ThemeName, name: string): string {
  const value = tokens[theme][name];
  if (value === undefined) throw new Error(`--${name} is not declared for ${theme}`);
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  if (alias) return color(theme, alias[1]);
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
    throw new Error(`--${name} is not a hex color: ${value}`);
  return value;
}

const rgb = (theme: ThemeName, name: string) => parseHex(color(theme, name));

/** Every pair below `min`, reported as "fg on bg: ratio". */
function failures(
  theme: ThemeName,
  fgs: string[],
  bgs: Record<string, ReturnType<typeof parseHex>>,
  min: number,
) {
  return fgs.flatMap((fg) =>
    Object.entries(bgs)
      .map(([bg, bgColor]) => [bg, contrastRatio(rgb(theme, fg), bgColor)] as const)
      .filter(([, ratio]) => ratio < min)
      .map(([bg, ratio]) => `--${fg} on ${bg}: ${ratio.toFixed(2)}`),
  );
}

const surfaces = (theme: ThemeName, names: string[]) =>
  Object.fromEntries(names.map((name) => [`--${name}`, rgb(theme, name)]));

const TEXT = [
  'foreground',
  'muted-foreground',
  'card-foreground',
  'popover-foreground',
  'secondary-foreground',
  'accent-foreground',
];
const SURFACE = ['background', 'card', 'popover', 'muted', 'secondary'];
const THEMES: ThemeName[] = ['dark', 'light'];

describe.each(THEMES)('%s theme', (theme) => {
  it('text tokens reach 4.5:1 on every surface and on the sheet veil', () => {
    const background = rgb(theme, 'background');
    const bgs = {
      ...surfaces(theme, SURFACE),
      'veil over black': over(background, 0.85, parseHex('#000000')),
      'veil over white': over(background, 0.85, parseHex('#ffffff')),
    };
    expect(failures(theme, TEXT, bgs, 4.5)).toEqual([]);
  });

  it('placeholder reaches 4.5:1 on background, card and input surfaces', () =>
    expect(
      failures(
        theme,
        ['placeholder'],
        surfaces(theme, ['background', 'card', 'popover', 'muted']),
        4.5,
      ),
    ).toEqual([]));

  it('accent-foreground on accent, destructive-foreground on destructive reach 4.5:1', () => {
    expect(failures(theme, ['accent-foreground'], surfaces(theme, ['accent']), 4.5)).toEqual([]);
    expect(
      failures(theme, ['destructive-foreground'], surfaces(theme, ['destructive']), 4.5),
    ).toEqual([]);
  });

  it('--input border reaches 3:1 on background and card', () =>
    expect(failures(theme, ['input'], surfaces(theme, ['background', 'card']), 3)).toEqual([]));

  it('item group colors reach 3:1 on background and card', () =>
    expect(
      failures(
        theme,
        ['weapons', 'armor', 'magic', 'tools', 'gear', 'other'].map((g) => `item-${g}`),
        surfaces(theme, ['background', 'card']),
        3,
      ),
    ).toEqual([]));

  // The icon and the group title use --item-flare on --item-surface (the color at 10% over the
  // card or the page): text, so 4.5:1
  it('item group flare reaches 4.5:1 on its own tinted surface', () => {
    const bad = ['weapons', 'armor', 'magic', 'tools', 'gear', 'other'].flatMap((group) => {
      const base = rgb(theme, `item-${group}`);
      const fg = flare(base, theme);
      return (['background', 'card'] as const)
        .map((bg) => [bg, contrastRatio(fg, over(base, 0.1, rgb(theme, bg)))] as const)
        .filter(([, ratio]) => ratio < 4.5)
        .map(([bg, ratio]) => `--item-${group} flare on surface over --${bg}: ${ratio.toFixed(2)}`);
    });
    expect(bad).toEqual([]);
  });

  it('SURFACES in contrast.ts match globals.css', () => {
    for (const name of ['background', 'card', 'popover', 'muted'] as const)
      expect(toHex(SURFACES[theme][name]), `--${name}`).toBe(color(theme, name).toLowerCase());
  });
});

// Every occurrence of each formula in globals.css must use the contrast.ts number.
it.each([
  ['-flare max(l, X)', /-flare: oklch\(from var\([\w-]+\) max\(l, ([\d.]+)\)/g, FLARE_MIN_L_DARK],
  ['-flare min(l, X)', /-flare: oklch\(from var\([\w-]+\) min\(l, ([\d.]+)\)/g, FLARE_MAX_L_LIGHT],
  ['-fill max(l, X)', /-fill: oklch\(from var\([\w-]+\) max\(l, ([\d.]+)\)/g, FILL_MIN_L_DARK],
  ['-fill min(l, X)', /-fill: oklch\(from var\([\w-]+\) min\(l, ([\d.]+)\)/g, FILL_MAX_L_LIGHT],
  ['min(c, X)', /min\(c, ([\d.]+)\)/g, FLARE_MAX_C],
  ['-on threshold', /clamp\(\s*0,\s*\(([\d.]+) -/g, ON_LUMINANCE],
  ['-on ramp', /\)\s*\*\s*([\d.e]+),\s*1\s*\)/g, ON_RAMP],
])('globals.css uses the contrast.ts number in every %s', (_, pattern, expected) => {
  const found = [...css.matchAll(pattern)].map(([, n]) => Number(n));
  expect(found.length).toBeGreaterThan(0);
  expect(found.filter((n) => n !== expected)).toEqual([]);
});

it('every lightness bound in globals.css belongs to a -flare or a -fill', () => {
  const bounds = [...css.matchAll(/(?:max|min)\(l, /g)].length;
  const known = [...css.matchAll(/-(?:flare|fill): oklch\(from var\([\w-]+\) (?:max|min)\(l, /g)]
    .length;
  expect(bounds).toBe(known);
});

// The character's color fills buttons, the XP bar, the portrait frame and the proficiency dot:
// any saved color is accepted, and only the derived fill moves, never the saved value
describe('--character-fill', () => {
  const EXTREMES = ['#fafafa', '#ffffff', '#ffff00', '#111111', '#000000', '#09090b', '#1e1b4b'];
  const SOLID = ['background', 'card', 'popover', 'muted'] as const;

  it.each(THEMES)('reaches 3:1 on every %s surface, even for extreme colors', (theme) => {
    const bad = EXTREMES.flatMap((hex) =>
      SOLID.map(
        (bg) => [bg, contrastRatio(fill(parseHex(hex), theme), SURFACES[theme][bg])] as const,
      )
        .filter(([, ratio]) => ratio < 3)
        .map(([bg, ratio]) => `${hex} on --${bg}: ${ratio.toFixed(2)}`),
    );
    expect(bad).toEqual([]);
  });

  it('leaves a color that already contrasts as it is', () => {
    expect(toHex(fill(parseHex('#ef4444'), 'dark'))).toBe('#ef4444');
    expect(toHex(fill(parseHex('#991b1b'), 'light'))).toBe('#991b1b');
  });

  it("is what bg-character, border-character and the sheet's primary-* paint with", () => {
    expect(css).toMatch(/--color-character: var\(--character-fill\);/);
    expect(css).toMatch(/\.character-context \{\s*--primary: var\(--character-fill\);\s*\}/);
    // Text on the fill is picked from the fill itself
    expect(css).toMatch(/--character-on: color\(\s*from var\(--character-fill\)/);
  });
});

it('every selector list that declares --spell-flare also includes .item-context', () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*--spell-flare:[^{}]*)\}/g)];
  expect(rules.length).toBeGreaterThanOrEqual(4);
  for (const [, selectors] of rules) expect(selectors).toContain('.item-context');
});
