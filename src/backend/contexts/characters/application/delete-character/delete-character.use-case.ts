import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';

export class DeleteCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string, ownerUsername: string): Promise<boolean> {
    const character = await this.repository.findById(id);

    if (!character) {
      throw new CharacterError(CharacterErrorCodes.DELETE_NOT_FOUND);
    }

    if (character.ownerUsername !== ownerUsername) {
      throw new CharacterError(CharacterErrorCodes.DELETE_UNAUTHORIZED);
    }

    return this.repository.delete(id);
  }
}
