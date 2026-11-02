import { describe, expect, it } from 'vitest';

import { formatPrice } from './format-price';

describe('formatPrice', () => {
  it.each([
    [150000, { amount: 1500, coin: 'gp' }],
    [5, { amount: 5, coin: 'cp' }],
    [50, { amount: 5, coin: 'sp' }],
    [1000, { amount: 10, coin: 'gp' }],
    [15, { amount: 15, coin: 'cp' }],
    [0.1, { amount: 0.1, coin: 'cp' }],
    [2.5, { amount: 2.5, coin: 'cp' }],
    [0.123, { amount: 0.12, coin: 'cp' }],
  ])('%s cobre vira %o', (copper, expected) => {
    expect(formatPrice(copper)).toEqual(expected);
  });

  it('nunca usa electro: 50 cobres são 5 de prata, não 1 de electro', () => {
    expect(formatPrice(50).coin).toBe('sp');
  });
});
