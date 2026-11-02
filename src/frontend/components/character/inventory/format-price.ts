import type { Coin } from '@shared/systems/dnd5e/coins';

/** Biggest first. Never electrum, and platinum is left for the character's purse, not for prices. */
const PRICE_COINS = [
  ['gp', 100],
  ['sp', 10],
  ['cp', 1],
] as const satisfies readonly (readonly [Coin, number])[];

/**
 * A price in copper in the biggest coin where it comes out whole: 150000 → 1500 gp, 50 → 5 sp.
 * A fraction of a copper piece (some ammunition) stays in cp, with up to 2 decimals.
 */
export function formatPrice(copper: number): { amount: number; coin: Coin } {
  if (Number.isInteger(copper) && copper > 0) {
    for (const [coin, value] of PRICE_COINS) {
      if (copper % value === 0) return { amount: copper / value, coin };
    }
  }
  return { amount: Math.round(copper * 100) / 100, coin: 'cp' };
}
