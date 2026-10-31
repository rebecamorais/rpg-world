import { InvitePreview } from '../domain/Party';
import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

export class GetInviteUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(code: string): Promise<InvitePreview> {
    const preview = await this.repository.getInvite(code);
    if (!preview) throw new PartyError(PartyErrorCodes.INVITE_NOT_FOUND);
    return preview;
  }
}
