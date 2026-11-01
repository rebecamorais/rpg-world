import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

export class SetPartyEditionUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, edition: Edition): Promise<void> {
    if (!(await this.repository.setEdition(partyId, edition))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}
