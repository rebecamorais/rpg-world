export type Side = 'player' | 'ally' | 'neutral' | 'enemy';
/** An npc sheet of the GM joins on either side. */
export type NpcSide = Exclude<Side, 'player'>;

/** A condition on a participant; `level` only for those with levels (exhaustion). */
export interface ActiveCondition {
  key: string;
  level: number | null;
}

export type Visibility = 'visible' | 'anonymous' | 'hidden';
/** What happens to an npc at 0 HP: rolls death saves, or is dead. */
export type NpcFate = 'death_saves' | 'dead';
export type Life = 'normal' | 'down' | 'dead';

/** A player's own character in their view: what the sheet says, to play without opening it. */
export interface OwnVitals {
  hp: { current: number; max: number; temp: number };
  ac: number;
  speed: number;
}

/**
 * What a player sees of each participant: no initiative, HP or AC of anyone but their own
 * characters.
 */
export interface TurnEntry {
  participantId: string;
  side: Side;
  /** null when anonymous: the client shows "Unknown enemy/ally/neutral". */
  name: string | null;
  avatarUrl: string | null;
  life: Life;
  isCurrent: boolean;
  isMine: boolean;
  /** Only on the player's own row. */
  initiative: number | null;
  /** Only on the player's own row: the sheet to open. */
  characterId: string | null;
  /** Player rows whose owner chose a username. */
  ownerUsername: string | null;
  conditions: ActiveCondition[];
  /** Only on the player's own row (from their sheet); null on everyone else's. */
  vitals: OwnVitals | null;
}

export interface PlayerEncounterView {
  role: 'player';
  /** 0 while the GM prepares the list. */
  round: number;
  hiddenTurn: boolean;
  turns: TurnEntry[];
}

/** A participant's row in the GM's initiative tracker. */
export interface GmRow {
  participantId: string;
  characterId: string;
  side: Side;
  name: string;
  initiative: number | null;
  /** Players whose owner chose a username; npcs: null. */
  ownerUsername: string | null;
  /** Players: from their sheet. NPCs (enemies and allies): the participant's own, with the sheet's max. */
  hp: { current: number; max: number; temp: number };
  /** A player at 0 HP (from the sheet), or an npc whose fate is death_saves (the participant's own). */
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
  conditions: ActiveCondition[];
  isCurrent: boolean;
  /** Players: 'visible'. */
  visibility: Visibility;
  /** Npcs at 0 HP only. */
  fate: NpcFate | null;
  deathRevealed: boolean;
}

export interface GmEncounterView {
  role: 'gm';
  round: number;
  rows: GmRow[];
}

export type EncounterView = PlayerEncounterView | GmEncounterView;

export const MAX_ENEMIES_PER_ADD = 20;
