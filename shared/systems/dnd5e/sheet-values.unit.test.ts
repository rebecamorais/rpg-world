import { describe, expect, it } from 'vitest';

import {
  type Adjustment,
  effectiveState,
  effectiveValue,
  followsSrd2014,
  switchAdjustment,
} from './sheet-values';

describe('effectiveValue', () => {
  it('follows the SRD default while the player has no adjustment', () => {
    expect(effectiveValue(3, undefined)).toBe(3);
  });

  it('the adjustment wins over the default', () => {
    expect(effectiveValue(3, { value: 4 })).toBe(4);
  });

  it('an adjustment equal to the default is still the adjustment when the default moves', () => {
    const adjustment: Adjustment<number> = { value: 3 };

    expect(effectiveValue(3, adjustment)).toBe(3);
    expect(effectiveValue(4, adjustment)).toBe(3);
  });

  it('a falsy adjustment counts: a saving throw turned off on purpose stays off', () => {
    expect(effectiveValue(true, { value: false })).toBe(false);
    expect(effectiveValue(2, { value: 0 })).toBe(0);
  });

  it('with no SRD default (unknown class, no edition) only the adjustment gives a value', () => {
    expect(effectiveValue(undefined, undefined)).toBeUndefined();
    expect(effectiveValue(undefined, { value: 2 })).toBe(2);
  });
});

describe('switchAdjustment', () => {
  it('following the SRD keeps the player value, switched off', () => {
    const off = switchAdjustment({ value: 4 }, false);

    expect(off).toEqual({ value: 4, off: true });
    expect(effectiveValue(3, off)).toBe(3);
  });

  it('switching it back on returns exactly the earlier value', () => {
    const back = switchAdjustment(switchAdjustment({ value: 4 }, false), true);

    expect(back).toEqual({ value: 4 });
    expect(effectiveValue(3, back)).toBe(4);
  });

  it('switching does not change the adjustment it was given', () => {
    const adjustment: Adjustment<number> = { value: 4 };

    switchAdjustment(adjustment, false);

    expect(adjustment).toEqual({ value: 4 });
  });
});

describe('effectiveState', () => {
  it('shows what was spent while it fits the maximum', () => {
    expect(effectiveState(2, 4)).toBe(2);
  });

  it('a lower maximum limits what is shown, not what is saved', () => {
    const saved = 3;

    expect(effectiveState(saved, 2)).toBe(2);
    // The maximum back up: the saved number was never rewritten
    expect(effectiveState(saved, 3)).toBe(3);
  });

  it('never goes below zero', () => {
    expect(effectiveState(-1, 4)).toBe(0);
    expect(effectiveState(2, -1)).toBe(0);
  });

  it('nothing saved yet counts as nothing spent', () => {
    expect(effectiveState(undefined, 4)).toBe(0);
  });
});

describe('followsSrd2014', () => {
  it('only a sheet explicitly set to 2014 gets SRD 5.1 defaults', () => {
    expect(followsSrd2014('2014')).toBe(true);
  });

  it.each([['2024' as const], [undefined]])('%s gets none', (edition) => {
    expect(followsSrd2014(edition)).toBe(false);
  });
});
