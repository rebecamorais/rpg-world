import { isFileIn, removeReplacedAsset } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';

import { fullImageUrl } from '@shared/avatar-files';

import { Character } from '../../domain/entity/Character';

/**
 * Deletes the avatar file `previousUrl` pointed to and its whole image, when it is no longer the
 * character's avatar. Only files UploadCharacterAvatarUseCase creates for this character are touched:
 * `<ownerId>/characters/<characterId>-<version>[-avatar].<ext>`.
 */
export async function removeCharacterAvatar(
  storage: StorageRepository,
  character: Pick<Character, 'id' | 'ownerUsername'> & { avatarUrl?: string },
  previousUrl: string | undefined,
): Promise<void> {
  const isRemovable = (path: string) =>
    isFileIn(path, `${character.ownerUsername}/characters`, `${character.id}-`);

  await removeReplacedAsset(storage, AVATAR_BUCKET, previousUrl, character.avatarUrl, isRemovable);

  const previousFull = previousUrl && fullImageUrl(previousUrl);
  if (!previousFull) return;
  const currentFull = character.avatarUrl ? fullImageUrl(character.avatarUrl) : null;
  await removeReplacedAsset(
    storage,
    AVATAR_BUCKET,
    previousFull,
    currentFull ?? undefined,
    isRemovable,
  );
}
