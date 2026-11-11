import { describe, expect, it } from 'vitest';

import {
  type Rgb,
  SURFACES,
  contrastRatio,
  flare,
  fromOklch,
  onColor,
  parseHex,
  toHex,
  toOklch,
} from './contrast';

describe('contrastRatio', () => {
  it('white on black is 21', () =>
    expect(contrastRatio(parseHex('#fff'), parseHex('#000'))).toBeCloseTo(21, 1));
  it('white on #ef4444 fails AA (the bug being fixed)', () =>
    expect(contrastRatio(parseHex('#ffffff'), parseHex('#ef4444'))).toBeCloseTo(3.76, 1));
});

describe('oklch round trip', () => {
  it.each(['#663399', '#ef4444', '#fde047', '#09090b'])('%s', (hex) =>
    expect(toHex(fromOklch(toOklch(parseHex(hex))))).toBe(hex),
  );
});

// The free picker: every hue, from near black to near white, saturated to grey
const sweep = (): Rgb[] => {
  const colors: Rgb[] = [];
  for (let h = 0; h < 360; h += 5)
    for (let l = 0.05; l <= 0.9701; l += 0.04)
      for (const c of [0, 0.05, 0.12, 0.2, 0.37]) colors.push(fromOklch({ l, c, h }));
  return colors;
};

describe.each(['dark', 'light'] as const)('flare on %s', (theme) => {
  it('reaches 4.5:1 on every surface of the theme, for every color', () => {
    const failures = sweep().flatMap((color) =>
      Object.entries(SURFACES[theme])
        .filter(([, bg]) => contrastRatio(flare(color, theme), bg) < 4.5)
        .map(
          ([name, bg]) =>
            `${toHex(color)} on ${name}: ${contrastRatio(flare(color, theme), bg).toFixed(2)}`,
        ),
    );
    expect(failures).toEqual([]);
  });
});

it('onColor reaches 4.5:1 on every solid color', () => {
  const failures = sweep()
    .filter((c) => contrastRatio(onColor(c), c) < 4.5)
    .map(toHex);
  expect(failures).toEqual([]);
});

it('the preset accent colors get black text', () => {
  for (const hex of ['#ef4444', '#3b82f6', '#ec4899', '#a855f7'])
    expect(toHex(onColor(parseHex(hex)))).toBe('#000000');
});

// mulberry32: deterministic, so a failure always reproduces
const seededColors = (count: number): Rgb[] => {
  let seed = 0x5eed;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => ({ r: random(), g: random(), b: random() }));
};
const offGrid = seededColors(50_000);

it('onColor reaches 4.5:1 off the grid too (seeded random sRGB sweep)', () => {
  const failures = offGrid
    .map((c) => [c, contrastRatio(onColor(c), c)] as const)
    .filter(([, ratio]) => ratio < 4.5)
    .map(([c, ratio]) => `${toHex(c)}: ${ratio.toFixed(3)}`);
  expect(failures).toEqual([]);
});

it('onColor is always pure black or pure white, never a gray from the CSS ramp', () => {
  // Closest to the threshold among 8-bit colors, and two that a 1e5 ramp turned gray
  const edges = ['#c10eef', '#007ea4', '#006cfd'].map(parseHex);
  const grays = [...offGrid, ...edges]
    .filter((c) => !['#000000', '#ffffff'].includes(toHex(onColor(c))) || onColor(c).r % 1 !== 0)
    .map(toHex);
  expect(grays).toEqual([]);
});
