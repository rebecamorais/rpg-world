import { ActiveCondition, NpcSide } from '../domain/Encounter';
import { ParticipantPatch } from '../domain/repository/combat.repo';
import { CombatContext } from '../index';

export const makeCombatApi = (combatContext: CombatContext) => ({
  get: (partyId: string, userId: string) => combatContext.get(partyId, userId),

  create: (partyId: string) => combatContext.create(partyId),

  addParticipant: (partyId: string, characterId: string, count: number, side?: NpcSide) =>
    combatContext.addParticipant(partyId, characterId, count, side),

  updateParticipant: (partyId: string, participantId: string, patch: ParticipantPatch) =>
    combatContext.updateParticipant(partyId, participantId, patch),

  removeParticipant: (partyId: string, participantId: string) =>
    combatContext.removeParticipant(partyId, participantId),

  setOrder: (partyId: string, participantIds: string[]) =>
    combatContext.setOrder(partyId, participantIds),

  start: (partyId: string) => combatContext.start(partyId),

  endTurn: (partyId: string, participantId: string) =>
    combatContext.endTurn(partyId, participantId),

  finish: (partyId: string) => combatContext.finish(partyId),

  setConditions: (partyId: string, participantId: string, conditions: ActiveCondition[]) =>
    combatContext.setConditions(partyId, participantId, conditions),
});
