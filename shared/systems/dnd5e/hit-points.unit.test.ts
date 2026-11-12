import { describe, expect, it } from 'vitest';

import { applyHitPoints } from './hit-points';

const at = (hpCurrent: number, hpTemp = 0, deathSaves = { successes: 0, failures: 0 }) => ({
  hpCurrent,
  hpMax: 31,
  hpTemp,
  deathSaves,
});

describe('applyHitPoints', () => {
  it('takes damage from the current hit points', () => {
    expect(applyHitPoints(at(31), 'damage', 7)).toEqual({ hpCurrent: 24, hpTemp: 0 });
  });

  it('takes damage from the temporary hit points first', () => {
    expect(applyHitPoints(at(20, 5), 'damage', 3)).toEqual({ hpCurrent: 20, hpTemp: 2 });
    expect(applyHitPoints(at(20, 5), 'damage', 8)).toEqual({ hpCurrent: 17, hpTemp: 0 });
  });

  it('stops at zero', () => {
    expect(applyHitPoints(at(4), 'damage', 50)).toEqual({ hpCurrent: 0, hpTemp: 0 });
  });

  it('heals up to the maximum, leaving the temporary hit points alone', () => {
    expect(applyHitPoints(at(20, 3), 'heal', 5)).toEqual({ hpCurrent: 25 });
    expect(applyHitPoints(at(29), 'heal', 10)).toEqual({ hpCurrent: 31 });
  });

  it('clears the death saves when healing from zero', () => {
    expect(applyHitPoints(at(0, 0, { successes: 1, failures: 2 }), 'heal', 4)).toEqual({
      hpCurrent: 4,
      deathSaves: { successes: 0, failures: 0 },
    });
  });

  it('replaces the temporary hit points (they do not stack)', () => {
    expect(applyHitPoints(at(20, 5), 'temp', 8)).toEqual({ hpTemp: 8 });
    expect(applyHitPoints(at(20, 5), 'temp', 0)).toEqual({ hpTemp: 0 });
  });

  it('ignores negative and fractional amounts', () => {
    expect(applyHitPoints(at(20), 'damage', -5)).toEqual({ hpCurrent: 20, hpTemp: 0 });
    expect(applyHitPoints(at(20), 'heal', 2.7)).toEqual({ hpCurrent: 22 });
  });
});
