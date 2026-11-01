export type Side = 'player' | 'enemy';

/** What a player sees of each participant: no initiative, HP or AC, of anyone. */
export interface TurnEntry {
  participantId: string;
  name: string;
  isCurrent: boolean;
  isMine: boolean;
}

export interface PlayerEncounterView {
  role: 'player';
  /** 0 while the GM prepares the list. */
  round: number;
  turns: TurnEntry[];
}

/** A participant's row in the GM's initiative tracker. */
export interface GmRow {
  participantId: string;
  characterId: string;
  side: Side;
  name: string;
  initiative: number | null;
  /** Players: from their sheet. Enemies: the participant's own, with the sheet's max. */
  hp: { current: number; max: number; temp: number };
  /** Only for a player at 0 HP. */
  deathSaves: { successes: number; failures: number } | null;
  avatarUrl: string | null;
  accentColor: string | null;
  race: string;
  class: string;
  level: number;
  ac: number;
  passivePerception: number;
  speed: number;
  /** Scores by key (STR, DEX...), as on the sheet. */
  attributes: Record<string, number>;
  isCurrent: boolean;
}

export interface GmEncounterView {
  role: 'gm';
  round: number;
  rows: GmRow[];
}

export type EncounterView = PlayerEncounterView | GmEncounterView;

export const MAX_ENEMIES_PER_ADD = 20;
