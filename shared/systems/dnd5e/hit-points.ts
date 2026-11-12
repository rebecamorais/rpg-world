import type { DnD5eCharacter } from './types';

export type HitPointsChange = 'damage' | 'heal' | 'temp';

type HitPoints = Pick<DnD5eCharacter, 'hpCurrent' | 'hpMax' | 'hpTemp' | 'deathSaves'>;

/**
 * What damage, healing or temporary hit points do to a sheet, as the fields that change:
 * - damage takes the temporary hit points first, then the current ones, down to 0;
 * - healing goes up to the maximum; from 0 it also clears the death saves;
 * - temporary hit points don't stack: the new amount replaces the old.
 */
export function applyHitPoints(
  hp: HitPoints,
  change: HitPointsChange,
  amount: number,
): Partial<HitPoints> {
  const value = Math.max(0, Math.floor(amount));
  const temp = hp.hpTemp ?? 0;

  switch (change) {
    case 'damage': {
      const fromTemp = Math.min(temp, value);
      return {
        hpCurrent: Math.max(0, hp.hpCurrent - (value - fromTemp)),
        hpTemp: temp - fromTemp,
      };
    }
    case 'heal': {
      const hpCurrent = Math.min(hp.hpMax, hp.hpCurrent + value);
      return hp.hpCurrent === 0 && hpCurrent > 0
        ? { hpCurrent, deathSaves: { successes: 0, failures: 0 } }
        : { hpCurrent };
    }
    case 'temp':
      return { hpTemp: value };
  }
}
