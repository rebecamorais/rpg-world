import { partyName } from '../domain/Party';
import { PartyRepo } from '../domain/repository/party.repo';

export class CreatePartyUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(gmId: string, name: string) {
    return { id: await this.repository.create(gmId, partyName(name)) };
  }
}
