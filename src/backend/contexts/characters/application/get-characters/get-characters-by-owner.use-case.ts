import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { Character, CharacterKind } from '../../domain/entity/Character';
import { CharacterRepo } from '../../domain/repository';

export class GetCharactersByOwnerUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(ownerUsername: string, kind: CharacterKind = 'pc'): Promise<Character[]> {
    if (!ownerUsername) throw new CharacterError(CharacterErrorCodes.GET_BY_OWNER_REQUIRED);
    return this.repository.findByOwner(ownerUsername, kind);
  }
}
