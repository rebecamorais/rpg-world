import { MemberStatus } from '../domain/Party';
import { PartyRepo } from '../domain/repository/party.repo';

export class RequestJoinUseCase {
  constructor(private readonly repository: PartyRepo) {}

  execute(code: string): Promise<MemberStatus> {
    return this.repository.requestJoin(code);
  }
}
