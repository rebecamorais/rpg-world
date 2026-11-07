import { isFileIn, removeReplacedAsset } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';

import { Character } from '../../domain/entity/Character';

const fileNamePrefix = (characterId: string) => `${characterId}-background-`;

export function sheetBackgroundPath(
  ownerId: string,
  characterId: string,
  version: string,
  extension: string,
): string {
  return `${ownerId}/characters/${fileNamePrefix(characterId)}${version}.${extension}`;
}

/**
 * Deletes the file `previousUrl` pointed to, when it is no longer the sheet's background. Only
 * files UploadSheetBackgroundUseCase creates for this character are touched.
 */
export async function removeCharacterSheetBackground(
  storage: StorageRepository,
  character: Pick<Character, 'id' | 'ownerUsername'> & { sheetBackgroundUrl?: string },
  previousUrl: string | undefined,
): Promise<void> {
  await removeReplacedAsset(
    storage,
    AVATAR_BUCKET,
    previousUrl,
    character.sheetBackgroundUrl,
    (path) => isFileIn(path, `${character.ownerUsername}/characters`, fileNamePrefix(character.id)),
  );
}
