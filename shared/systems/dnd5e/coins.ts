export type Coins = { cp: number; sp: number; ep: number; gp: number; pp: number };
export type Coin = keyof Coins;

/** Smallest first. */
export const COINS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const satisfies readonly Coin[];

/** SRD exchange rates, in copper. */
const COIN_VALUE: Record<Coin, number> = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };

const CHANGE_COINS: readonly Coin[] = ['pp', 'gp', 'sp', 'cp'];

export const EMPTY_PURSE: Coins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

export const toCopper = (coins: Coins) =>
  COINS.reduce((total, coin) => total + coins[coin] * COIN_VALUE[coin], 0);

/** `copper` in the biggest coins possible, without electrum (as change comes back at most tables). */
export function fromCopper(copper: number): Coins {
  const coins = { ...EMPTY_PURSE };
  let left = copper;
  for (const c of CHANGE_COINS) {
    coins[c] = Math.floor(left / COIN_VALUE[c]);
    left -= coins[c] * COIN_VALUE[c];
  }
  return coins;
}

export type Payment =
  | { ok: true; spent: Coins; change: Coins; after: Coins }
  /** `missing` is in copper. */
  | { ok: false; missing: number };

/**
 * Pays `amount` of `coin` from the purse: first with that coin, then by breaking the next bigger
 * coins, and only then with smaller ones (biggest first). Whatever was overpaid comes back as
 * change, in the biggest coins possible.
 */
export function pay(purse: Coins, amount: number, coin: Coin): Payment {
  if (!Number.isInteger(amount) || amount <= 0) throw new RangeError('amount must be positive');

  const price = amount * COIN_VALUE[coin];
  const total = toCopper(purse);
  if (total < price) return { ok: false, missing: price - total };

  const spent = { ...EMPTY_PURSE };
  let remaining = price;
  const take = (c: Coin, count: number) => {
    const n = Math.min(purse[c], count);
    spent[c] += n;
    remaining -= n * COIN_VALUE[c];
  };

  take(coin, Math.floor(remaining / COIN_VALUE[coin]));

  const index = COINS.indexOf(coin);
  const bigger = COINS.slice(index + 1);
  const smaller = COINS.slice(0, index).reverse();
  for (const c of [...bigger, ...smaller]) {
    if (remaining <= 0) break;
    take(c, Math.ceil(remaining / COIN_VALUE[c]));
  }

  const change = fromCopper(remaining < 0 ? -remaining : 0);
  const after = { ...purse };
  for (const c of COINS) after[c] += change[c] - spent[c];

  return { ok: true, spent, change, after };
}

/** Adds `amount` of `coin` as it came, without exchanging anything. */
export const receive = (purse: Coins, amount: number, coin: Coin): Coins => ({
  ...purse,
  [coin]: purse[coin] + amount,
});
