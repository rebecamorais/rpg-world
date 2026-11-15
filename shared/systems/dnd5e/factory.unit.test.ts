import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from './factory';

describe('createDnD5eCharacter', () => {
  it('a new sheet starts with the SRD walking speed in metres (9 m = 30 ft)', () => {
    expect(createDnD5eCharacter('owner', 'Thor').speed).toBe(9);
  });

  it('keeps a speed it is given', () => {
    expect(createDnD5eCharacter('owner', 'Thor', { speed: 7.5 }).speed).toBe(7.5);
  });
});
