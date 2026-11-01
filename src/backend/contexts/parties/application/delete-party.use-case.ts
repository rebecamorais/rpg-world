import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

/** Only the party goes: members and their characters stay. */
export class DeletePartyUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string): Promise<void> {
    if (!(await this.repository.delete(partyId))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}
