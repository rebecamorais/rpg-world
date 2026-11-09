import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { CombatRepo } from '../domain/repository/combat.repo';

/**
 * The operations that are one database call each. Who may run them (the GM; a player only to end
 * their own turn and set their own initiative) is decided by the database, which raises the matching CombatError.
 */
export class EncounterCommands {
  constructor(private readonly repository: CombatRepo) {}

  create(partyId: string) {
    return this.repository.create(partyId);
  }

  async removeParticipant(partyId: string, participantId: string) {
    if (!(await this.repository.removeParticipant(partyId, participantId))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }

  setOrder(partyId: string, participantIds: string[]) {
    return this.repository.setOrder(partyId, participantIds);
  }

  start(partyId: string) {
    return this.repository.start(partyId);
  }

  endTurn(partyId: string, participantId: string) {
    return this.repository.endTurn(partyId, participantId);
  }

  previousTurn(partyId: string) {
    return this.repository.previousTurn(partyId);
  }

  async setMyInitiative(partyId: string, participantId: string, initiative: number | null) {
    if (!(await this.repository.setMyInitiative(partyId, participantId, initiative))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }

  async finish(partyId: string) {
    if (!(await this.repository.finish(partyId))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }
}
