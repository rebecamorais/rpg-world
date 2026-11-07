import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AssetVersionGenerator, newAssetVersion } from '@backend/shared/domain/asset-version';
import {
  ALLOWED_AVATAR_TYPES,
  AVATAR_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
} from '@backend/shared/domain/avatar';

import { avatarPathOf } from '@shared/avatar-files';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository/character.repo';
import { assertOwnsCharacter } from '../find-owned-character';

export function assertValidImage(image: Blob) {
  if (image.size > MAX_AVATAR_SIZE_BYTES) {
    throw new CharacterError(CharacterErrorCodes.AVATAR_FILE_TOO_LARGE);
  }
  if (!ALLOWED_AVATAR_TYPES.includes(image.type)) {
    throw new CharacterError(CharacterErrorCodes.AVATAR_INVALID_TYPE);
  }
}

/**
 * Uploads the image and returns its URL. With `full`, the whole image, `file` is the avatar cut from it. It does not update the character record: like the
 * profile avatar, the caller saves the URL through the regular character update.
 */
export class UploadCharacterAvatarUseCase {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly characterRepository: CharacterRepo,
    private readonly newVersion: AssetVersionGenerator = newAssetVersion,
  ) {}

  async execute(characterId: string, userId: string, file: Blob, full?: Blob): Promise<string> {
    await assertOwnsCharacter(this.characterRepository, characterId, userId, 'write');

    assertValidImage(file);
    if (full) {
      assertValidImage(full);
      // Both names share one extension: the viewer finds the whole image from the avatar's URL
      if (full.type !== file.type)
        throw new CharacterError(CharacterErrorCodes.AVATAR_INVALID_TYPE);
    }

    const extension = file.type.split('/')[1];
    // The path starts with userId to comply with the bucket's RLS policies. It is versioned
    // because the proxy lets images be cached, so each upload needs a new URL; the previous
    // file is kept because the new URL is only saved with the next character update.
    const path = `${userId}/characters/${characterId}-${this.newVersion()}.${extension}`;

    if (!full) return this.storageRepository.upload(AVATAR_BUCKET, path, file);

    await this.storageRepository.upload(AVATAR_BUCKET, path, full);
    try {
      return await this.storageRepository.upload(AVATAR_BUCKET, avatarPathOf(path), file);
    } catch (error) {
      // Nothing will ever name this file, and the cleanup job keeps a whole image without an avatar
      try {
        await this.storageRepository.remove(AVATAR_BUCKET, path);
      } catch (removeError) {
        console.warn(`Could not remove ${AVATAR_BUCKET}/${path}:`, removeError);
      }
      throw error;
    }
  }
}
