import { Side, TurnEntry } from '../Encounter';

export interface ParticipantRecord {
  id: string;
  characterId: string;
  side: Side;
  /** Enemies only ("Goblin 2"); a player's name comes from the sheet. */
  label: string | null;
  initiative: number | null;
  position: number;
  /** Enemies only. */
  hpCurrent: number | null;
  hpTemp: number | null;
}

export interface EncounterRecord {
  round: number;
  currentParticipantId: string | null;
  /** In turn order. */
  participants: ParticipantRecord[];
}

/** What the GM's row needs from a sheet. */
export interface CombatSheet {
  id: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  hpTemp: number;
  avatarUrl: string | null;
  accentColor: string | null;
  race: string;
  class: string;
  ac: number;
  speed: number;
  level: number;
  attributes: Record<string, number>;
  skills: Record<string, { isProficient?: boolean; expertise?: boolean } | undefined>;
  deathSaves: { successes: number; failures: number } | null;
}

export interface NewParticipant {
  characterId: string;
  side: Side;
  label: string | null;
}

export interface ParticipantPatch {
  label?: string;
  initiative?: number | null;
  hpCurrent?: number;
  hpTemp?: number;
}

/**
 * Acts as the signed-in user: the database decides who may do what (only the GM touches the
 * combat tables; players go through encounter_turns and end_turn). Methods that change a row
 * answer `false` when nothing was allowed to change.
 */
export interface CombatRepo {
  /** Null when the party doesn't exist or the person has no link to it. */
  findPartyGm(partyId: string): Promise<string | null>;
  /** The GM's view of the combat; null without one (or for anyone but the GM). */
  findEncounter(partyId: string): Promise<EncounterRecord | null>;
  sheets(characterIds: string[]): Promise<CombatSheet[]>;
  /** What a player sees; null without a combat. */
  turns(partyId: string): Promise<{ round: number; turns: TurnEntry[] } | null>;
  /** The characters brought to the party. */
  partyCharacterIds(partyId: string): Promise<string[]>;
  /** One of the signed-in user's npc sheets; null for any other character. */
  enemySheet(characterId: string): Promise<{ name: string } | null>;
  create(partyId: string): Promise<void>;
  addParticipants(partyId: string, participants: NewParticipant[]): Promise<void>;
  updateParticipant(partyId: string, id: string, patch: ParticipantPatch): Promise<boolean>;
  removeParticipant(partyId: string, id: string): Promise<boolean>;
  setOrder(partyId: string, participantIds: string[]): Promise<void>;
  start(partyId: string): Promise<void>;
  endTurn(partyId: string, participantId: string): Promise<void>;
  finish(partyId: string): Promise<boolean>;
}
