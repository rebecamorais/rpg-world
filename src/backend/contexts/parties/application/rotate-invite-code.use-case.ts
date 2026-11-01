import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

/** A new invite link; the old one stops working at once (a leaked link is just replaced). */
export class RotateInviteCodeUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string): Promise<string> {
    const code = crypto.randomUUID().replaceAll('-', '');
    if (!(await this.repository.setInviteCode(partyId, code))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
    return code;
  }
}
