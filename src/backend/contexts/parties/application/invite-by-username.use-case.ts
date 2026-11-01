import { MemberStatus } from '../domain/Party';
import { PartyRepo } from '../domain/repository/party.repo';

export class InviteByUsernameUseCase {
  constructor(private readonly repository: PartyRepo) {}

  /** Accepts the username as people write it: "@bia" or " bia ". */
  execute(partyId: string, username: string): Promise<MemberStatus> {
    return this.repository.invite(partyId, username.trim().replace(/^@/, ''));
  }
}
