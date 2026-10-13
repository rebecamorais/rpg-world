import { CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { findOwnedCharacter } from '../find-owned-character';

export class GetCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string, requesterId: string) {
    return findOwnedCharacter(this.repository, id, requesterId, 'read', {
      notFound: CharacterErrorCodes.GET_NOT_FOUND,
      forbidden: CharacterErrorCodes.GET_NOT_FOUND,
    });
  }
}
