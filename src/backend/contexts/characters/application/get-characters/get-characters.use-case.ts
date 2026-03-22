import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';

export class GetCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string) {
    const character = await this.repository.findById(id);
    if (!character) throw new CharacterError(CharacterErrorCodes.GET_NOT_FOUND);

    return character;
  }
}
