import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { findOwnedCharacter } from '../find-owned-character';
import { removeCharacterSheetBackground } from '../sheet-background/sheet-background-file';
import { removeCharacterAvatar } from '../upload-avatar/character-avatar-file';

export class DeleteCharacterUseCase {
  constructor(
    private repository: CharacterRepo,
    private readonly storageRepository?: StorageRepository,
  ) {}

  async execute(id: string, ownerUsername: string): Promise<boolean> {
    const character = await findOwnedCharacter(this.repository, id, ownerUsername, 'write', {
      notFound: CharacterErrorCodes.DELETE_NOT_FOUND,
      forbidden: CharacterErrorCodes.DELETE_UNAUTHORIZED,
    });

    const deleted = await this.repository.delete(id);

    // The character's images go with it
    if (deleted && this.storageRepository) {
      await removeCharacterAvatar(
        this.storageRepository,
        { id: character.id, ownerUsername: character.ownerUsername },
        character.avatarUrl,
      );
      await removeCharacterSheetBackground(
        this.storageRepository,
        { id: character.id, ownerUsername: character.ownerUsername },
        character.sheetBackgroundUrl,
      );
    }

    return deleted;
  }
}
