import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { LoreError, LoreErrorCodes } from '../../domain/LoreError';
import { LoreRepository } from '../../domain/repository/lore.repo';

/** The lore of a character brought to the GM's party, read only. */
export class GetPartyLoreUseCase {
  constructor(
    private readonly repository: LoreRepository,
    private readonly access: PartyGmAccess,
  ) {}

  async execute(partyId: string, characterId: string, gmId: string) {
    if (!(await this.access.isGmOfCharacter(partyId, characterId, gmId))) {
      throw new LoreError(LoreErrorCodes.CHARACTER_NOT_FOUND);
    }
    return this.repository.findByCharacterId(characterId);
  }
}
