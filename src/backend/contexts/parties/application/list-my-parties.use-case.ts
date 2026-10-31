import { MyParties } from '../domain/Party';
import { PartyRepo } from '../domain/repository/party.repo';

export class ListMyPartiesUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(): Promise<MyParties> {
    const parties = await this.repository.listMine();
    return {
      asGm: parties.filter((p) => p.role === 'gm'),
      asPlayer: parties.filter((p) => p.role === 'player' && p.status === 'active'),
      invites: parties.filter((p) => p.status === 'invited'),
      requests: parties.filter((p) => p.status === 'requested'),
    };
  }
}
