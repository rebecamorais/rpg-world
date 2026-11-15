import { describe, expect, it } from 'vitest';

import { HIT_DIE_OPTIONS, hitDiceRemaining, hitDieSides, readHitDice } from './hit-dice';

describe('readHitDice', () => {
  it('a sheet that never set hit dice has spent none', () => {
    expect(readHitDice(undefined, 5)).toEqual({ spent: 0 });
    expect(readHitDice(null, 5)).toEqual({ spent: 0 });
  });

  it('the stored shape passes through', () => {
    expect(readHitDice({ die: 'd10', spent: 2 }, 5)).toEqual({ die: 'd10', spent: 2 });
    expect(readHitDice({ spent: 3 }, 5)).toEqual({ spent: 3 });
  });

  it('spent above the level is kept as saved: only what shows is limited', () => {
    expect(readHitDice({ die: 'd8', spent: 5 }, 3)).toEqual({ die: 'd8', spent: 5 });
  });

  it('spent is always a whole number from 0 up', () => {
    expect(readHitDice({ spent: -2 }, 5).spent).toBe(0);
    expect(readHitDice({ spent: 2.7 }, 5).spent).toBe(2);
    expect(readHitDice({ spent: Number.NaN }, 5).spent).toBe(0);
    expect(readHitDice({ spent: '3' } as never, 5).spent).toBe(0);
  });

  it('an unknown die is dropped, with no die key left behind', () => {
    const read = readHitDice({ die: 'd20', spent: 1 } as never, 5);

    expect(read).toEqual({ spent: 1 });
    expect(read).not.toHaveProperty('die');
    expect(readHitDice(undefined, 5)).not.toHaveProperty('die');
    expect(readHitDice({ total: '', current: 5 }, 5)).not.toHaveProperty('die');
  });

  describe('sheets saved before 2026-11 (total and dice left)', () => {
    it.each([
      ['5d10', 'd10'],
      ['1d8', 'd8'],
      ['d6', 'd6'],
      ['4d12', 'd12'],
    ])('reads the die at the end of %s', (total, die) => {
      expect(readHitDice({ total, current: 5 }, 5)).toEqual({ die, spent: 0 });
    });

    it.each(['', 'abc', '3d7', 'd16', 'd100', '1d8 '])('finds no die in "%s"', (total) => {
      expect(readHitDice({ total, current: 5 }, 5)).toEqual({ spent: 0 });
    });

    it('what was spent is the level minus the dice left, never negative', () => {
      expect(readHitDice({ total: '5d8', current: 3 }, 5).spent).toBe(2);
      expect(readHitDice({ total: '5d8', current: 0 }, 5).spent).toBe(5);
      expect(readHitDice({ total: '4d8', current: 9 }, 4).spent).toBe(0);
    });

    it('without a number of dice left, none was spent', () => {
      expect(readHitDice({ total: '5d8' } as never, 5)).toEqual({ die: 'd8', spent: 0 });
      expect(readHitDice({ total: '5d8', current: null } as never, 5).spent).toBe(0);
      expect(readHitDice({} as never, 5)).toEqual({ spent: 0 });
    });
  });
});

describe('hitDiceRemaining', () => {
  it('is the level minus what was spent', () => {
    expect(hitDiceRemaining({ die: 'd8', spent: 2 }, 5)).toBe(3);
    expect(hitDiceRemaining(undefined, 4)).toBe(4);
    expect(hitDiceRemaining({ total: '5d10', current: 3 }, 5)).toBe(3);
  });

  it('never goes below 0 nor above the level', () => {
    expect(hitDiceRemaining({ spent: 9 }, 4)).toBe(0);
    expect(hitDiceRemaining({ total: '4d8', current: 9 }, 4)).toBe(4);
  });

  it('level 5 with 0 dice remaining → level 3 → level 5 = 0 dice remaining', () => {
    // A level change never rewrites the sheet's hit dice: the same saved value at each level
    const saved = { die: 'd8', spent: 5 } as const;

    expect(hitDiceRemaining(saved, 5)).toBe(0);
    expect(hitDiceRemaining(saved, 3)).toBe(0);
    expect(readHitDice(saved, 3).spent).toBe(5);
    expect(hitDiceRemaining(saved, 5)).toBe(0);
  });

  it('a new level brings its die already available', () => {
    expect(hitDiceRemaining({ die: 'd8', spent: 2 }, 5)).toBe(3);
    expect(hitDiceRemaining({ die: 'd8', spent: 2 }, 6)).toBe(4);
  });
});

describe('hitDieSides', () => {
  it('gives the sides of the die, in either shape', () => {
    expect(hitDieSides({ die: 'd10', spent: 0 })).toBe(10);
    expect(hitDieSides({ total: '5d10', current: 3 })).toBe(10);
    expect(hitDieSides({ total: 'd6', current: 1 })).toBe(6);
  });

  it('is null without a die', () => {
    expect(hitDieSides({ spent: 0 })).toBeNull();
    expect(hitDieSides({ total: '', current: 3 })).toBeNull();
    expect(hitDieSides(undefined)).toBeNull();
  });

  it('covers every die a class can have', () => {
    expect(HIT_DIE_OPTIONS.map((die) => hitDieSides({ die, spent: 0 }))).toEqual([6, 8, 10, 12]);
  });
});
