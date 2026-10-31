import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { Character } from '../../domain/entity/Character';
import { CharacterRepo } from '../../domain/repository';

/** The GM reading a character brought to their party; anyone else gets "not found". */
export class GetPartyCharacterUseCase {
  constructor(
    private readonly repository: CharacterRepo,
    private readonly access: PartyGmAccess,
  ) {}

  async execute(partyId: string, id: string, gmId: string): Promise<Character> {
    const character =
      (await this.access.isGmOfCharacter(partyId, id, gmId)) &&
      (await this.repository.findById(id));
    if (!character) throw new CharacterError(CharacterErrorCodes.GET_NOT_FOUND);
    return character;
  }
}
