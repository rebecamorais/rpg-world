import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

/**
 * The GM approving someone's request, or the invited person accepting. The database lets each one
 * do only their side (the GM can't accept an invite on someone's behalf).
 */
export class AcceptMemberUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, memberId: string): Promise<void> {
    if (!(await this.repository.activateMember(partyId, memberId))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}
