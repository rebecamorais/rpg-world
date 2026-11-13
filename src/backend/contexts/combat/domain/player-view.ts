import { OwnVitals, TurnEntry } from './Encounter';
import { CombatSheet, TurnRecord } from './repository/combat.repo';

/** The characters whose sheets the player view may read: only the player's own rows. */
export function ownCharacterIds(turns: TurnRecord[]): string[] {
  const ids = turns.flatMap((turn) => (turn.isMine && turn.characterId ? [turn.characterId] : []));
  return [...new Set(ids)];
}

/**
 * The player's turn order with HP, AC and speed on their own rows. Privacy boundary: a row gets
 * them only when it is theirs (`isMine`) and the sheet is owned by them, so nobody else's
 * numbers reach the player, even if a sheet that isn't theirs were passed in.
 */
export function withOwnVitals(
  turns: TurnRecord[],
  sheets: CombatSheet[],
  userId: string,
): TurnEntry[] {
  const own = new Map(
    sheets.filter((sheet) => sheet.ownerId === userId).map((sheet) => [sheet.id, sheet]),
  );
  return turns.map((turn) => {
    const sheet = turn.isMine && turn.characterId ? own.get(turn.characterId) : undefined;
    const vitals: OwnVitals | null = sheet
      ? {
          hp: { current: sheet.hpCurrent, max: sheet.hpMax, temp: sheet.hpTemp },
          ac: sheet.ac,
          speed: sheet.speed,
        }
      : null;
    return { ...turn, vitals };
  });
}
