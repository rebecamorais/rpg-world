import { CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { findOwnedCharacter } from '../find-owned-character';

export class DeleteCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string, ownerUsername: string): Promise<boolean> {
    await findOwnedCharacter(this.repository, id, ownerUsername, 'write', {
      notFound: CharacterErrorCodes.DELETE_NOT_FOUND,
      forbidden: CharacterErrorCodes.DELETE_UNAUTHORIZED,
    });

    return this.repository.delete(id);
  }
}
