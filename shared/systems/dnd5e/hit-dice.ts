import { effectiveState } from './sheet-values';

export const HIT_DIE_OPTIONS = ['d6', 'd8', 'd10', 'd12'] as const;
export type HitDie = (typeof HIT_DIE_OPTIONS)[number];

/**
 * Hit dice as the sheet stores them: the die and how many were spent. How many are left is never
 * stored, it follows the level (`hitDiceRemaining`), so a level change leaves what was spent alone.
 */
export interface HitDice {
  die?: HitDie;
  spent: number;
}

/**
 * How sheets saved before 2026-11 keep it: `total` with the die at its end (`5d10`, `1d8`) and
 * `current`, the dice left. A copy cached on the client may still hold it.
 */
export interface LegacyHitDice {
  total: string;
  current: number;
}

const LEGACY_DIE = /(d6|d8|d10|d12)$/;

const isHitDie = (die: unknown): die is HitDie => HIT_DIE_OPTIONS.includes(die as HitDie);
const wholeFromZero = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(Math.trunc(value), 0) : 0;

/**
 * The sheet's hit dice in the stored shape, whichever shape they came in. In the legacy one what
 * was spent is worked out from the dice left at `level`. Without a die there is no `die` key.
 */
export function readHitDice(
  raw: HitDice | LegacyHitDice | undefined | null,
  level: number,
): HitDice {
  if (!raw) return { spent: 0 };

  // Read field by field: the value comes from storage or the network, whatever its type says
  const { die, spent, total, current }: Partial<HitDice & LegacyHitDice> = raw;

  if (spent !== undefined || die !== undefined) {
    return { ...(isHitDie(die) && { die }), spent: wholeFromZero(spent) };
  }

  const legacyDie = typeof total === 'string' ? total.match(LEGACY_DIE)?.[1] : undefined;
  return {
    ...(isHitDie(legacyDie) && { die: legacyDie }),
    spent: typeof current === 'number' ? wholeFromZero(level - current) : 0,
  };
}

/** Hit dice left to spend, between 0 and the level. A sheet that never set them has them all. */
export function hitDiceRemaining(
  hitDice: HitDice | LegacyHitDice | undefined | null,
  level: number,
): number {
  return level - effectiveState(readHitDice(hitDice, level).spent, level);
}

/** The die's sides (`d10` → 10), or null without a die. */
export function hitDieSides(hitDice: HitDice | LegacyHitDice | undefined | null): number | null {
  const { die } = readHitDice(hitDice, 0);
  return die ? Number(die.slice(1)) : null;
}
