import { isFileIn, removeReplacedAsset } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';

import { Character } from '../../domain/entity/Character';

/**
 * Deletes the avatar file `previousUrl` pointed to, when it is no longer the character's avatar.
 * Only files UploadCharacterAvatarUseCase creates for this character are touched:
 * `<ownerId>/characters/<characterId>-<version>.<ext>`.
 */
export function removeCharacterAvatar(
  storage: StorageRepository,
  character: Pick<Character, 'id' | 'ownerUsername'> & { avatarUrl?: string },
  previousUrl: string | undefined,
): Promise<void> {
  return removeReplacedAsset(storage, AVATAR_BUCKET, previousUrl, character.avatarUrl, (path) =>
    isFileIn(path, `${character.ownerUsername}/characters`, `${character.id}-`),
  );
}
