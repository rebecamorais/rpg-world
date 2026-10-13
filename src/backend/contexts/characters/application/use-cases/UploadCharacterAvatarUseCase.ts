import { StorageRepository } from '../../../../shared/domain/StorageRepository';
import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository/character.repo';
import { findOwnedCharacter } from '../find-owned-character';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads the image and returns its URL. It does not update the character record: like the
 * profile avatar, the caller saves the URL through the regular character update.
 */
export class UploadCharacterAvatarUseCase {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly characterRepository: CharacterRepo,
  ) {}

  async execute(characterId: string, userId: string, file: Blob): Promise<string> {
    await findOwnedCharacter(this.characterRepository, characterId, userId, 'write');

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new CharacterError(CharacterErrorCodes.AVATAR_FILE_TOO_LARGE);
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      throw new CharacterError(CharacterErrorCodes.AVATAR_INVALID_TYPE);
    }

    const extension = file.type.split('/')[1];
    // The path starts with userId to comply with the bucket's RLS policies
    const path = `${userId}/characters/${characterId}.${extension}`;

    return this.storageRepository.upload(AVATAR_BUCKET, path, file);
  }
}
