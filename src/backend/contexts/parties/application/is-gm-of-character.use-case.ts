import { PartyRepo } from '../domain/repository/party.repo';

/**
 * Whether `userId` is the GM of the party and the character is in it (brought by an active
 * member, not deleted). The database enforces the same rule on the character tables.
 */
export class IsGmOfCharacterUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, characterId: string, userId: string): Promise<boolean> {
    const party = await this.repository.findParty(partyId);
    if (!userId || party?.gmId !== userId) return false;

    const roster = await this.repository.roster(partyId);
    return roster.some((c) => c.characterId === characterId);
  }
}
