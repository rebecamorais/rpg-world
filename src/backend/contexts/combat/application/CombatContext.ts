import { ActiveCondition, EncounterView, NpcSide } from '../domain/Encounter';
import { ParticipantPatch } from '../domain/repository/combat.repo';

/**
 * Operations the combat context exposes to the interface layer. They act as the signed-in user:
 * who may change what is decided by the database (RLS and the combat functions).
 */
export interface CombatContext {
  get(partyId: string, userId: string): Promise<EncounterView | null>;
  create(partyId: string): Promise<void>;
  addParticipant(
    partyId: string,
    characterId: string,
    count: number,
    side?: NpcSide,
  ): Promise<void>;
  updateParticipant(partyId: string, participantId: string, patch: ParticipantPatch): Promise<void>;
  removeParticipant(partyId: string, participantId: string): Promise<void>;
  setOrder(partyId: string, participantIds: string[]): Promise<void>;
  start(partyId: string): Promise<void>;
  endTurn(partyId: string, participantId: string): Promise<void>;
  previousTurn(partyId: string): Promise<void>;
  setMyInitiative(partyId: string, participantId: string, initiative: number | null): Promise<void>;
  finish(partyId: string): Promise<void>;
  setConditions(
    partyId: string,
    participantId: string,
    conditions: ActiveCondition[],
  ): Promise<void>;
}
