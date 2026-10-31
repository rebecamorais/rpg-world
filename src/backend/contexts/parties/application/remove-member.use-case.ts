import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

/**
 * The person leaving, declining an invite or withdrawing a request; or the GM removing someone or
 * declining a request. Their characters leave the party, not their sheets.
 */
export class RemoveMemberUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, memberId: string): Promise<void> {
    if (!(await this.repository.deleteMember(partyId, memberId))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}
