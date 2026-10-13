import { describe, expect, it } from 'vitest';

import { hexToHsl } from './color-utils';

describe('hexToHsl', () => {
  it.each([
    ['#ff0000', { h: 0, s: 100, l: 50 }],
    ['#00ff00', { h: 120, s: 100, l: 50 }],
    ['#0000ff', { h: 240, s: 100, l: 50 }],
    ['#663399', { h: 270, s: 50, l: 40 }],
    ['#ffffff', { h: 0, s: 0, l: 100 }],
    ['#000000', { h: 0, s: 0, l: 0 }],
  ])('converte %s', (hex, hsl) => {
    expect(hexToHsl(hex)).toEqual(hsl);
  });

  it('aceita a forma curta e sem #, sem diferenciar maiúsculas', () => {
    expect(hexToHsl('F00')).toEqual(hexToHsl('#ff0000'));
  });

  it.each(['#12345', 'red', '#gggggg', ''])('rejeita %j', (hex) => {
    expect(() => hexToHsl(hex)).toThrow('Invalid hex color');
  });
});
