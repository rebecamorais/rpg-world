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

  it('holds only shapes and gradients: nothing that runs code or loads anything (rendered as HTML)', () => {
    for (const { markup } of Object.values(ART)) {
      expect(markup).not.toMatch(
        /<!--|<\/?(?:script|style|foreignObject|iframe|object|embed|image|use|a|animate\w*|set)\b|\son\w+\s*=|(?:java|vb)script:|\b(?:xlink:)?href\s*=|url\((?!#__ID__)/i,
      );
    }
  });
});
