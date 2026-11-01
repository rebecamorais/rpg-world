import { PartyRepo } from '../domain/repository/party.repo';

/** Which of their characters a player brings to the party: adds and removes the difference. */
export class SetMyCharactersUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, userId: string, characterIds: string[]): Promise<void> {
    const wanted = new Set(characterIds);
    const current = new Set(
      (await this.repository.roster(partyId))
        .filter((c) => c.ownerId === userId)
        .map((c) => c.characterId),
    );

    const toRemove = [...current].filter((id) => !wanted.has(id));
    const toAdd = [...wanted].filter((id) => !current.has(id));

    if (toRemove.length) await this.repository.removeCharacters(partyId, toRemove);
    if (toAdd.length) await this.repository.addCharacters(partyId, toAdd);
  }
}
