import { describe, expect, it } from 'vitest';

import { ART } from './art';
import { EFFECTS } from './types';

describe('EFFECTS', () => {
  it('has a drawing for every effect drawn by the owner', () => {
    const drawn = Object.entries(EFFECTS).filter(([, spec]) => spec.parts === 'art');
    expect(drawn.map(([id]) => id).sort()).toEqual(Object.keys(ART).sort());
  });
});

describe('ART', () => {
  it('keeps no fixed colours: every colour is a tone of the card', () => {
    for (const { markup } of Object.values(ART)) {
      expect(markup).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    }
  });
});
