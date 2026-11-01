import { partyName } from '../domain/Party';
import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

export class RenamePartyUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, name: string): Promise<void> {
    if (!(await this.repository.rename(partyId, partyName(name)))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}
