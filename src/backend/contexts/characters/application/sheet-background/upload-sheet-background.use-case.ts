import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AssetVersionGenerator, newAssetVersion } from '@backend/shared/domain/asset-version';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';

import { CharacterRepo } from '../../domain/repository/character.repo';
import { assertOwnsCharacter } from '../find-owned-character';
import { assertValidImage } from '../upload-avatar/upload-character-avatar.use-case';
import { sheetBackgroundPath } from './sheet-background-file';

/**
 * Uploads the art behind the sheet and returns its URL. Like the avatar, the caller saves the URL
 * through the regular character update, so the previous file is kept until then.
 */
export class UploadSheetBackgroundUseCase {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly characterRepository: CharacterRepo,
    private readonly newVersion: AssetVersionGenerator = newAssetVersion,
  ) {}

  async execute(characterId: string, userId: string, file: Blob): Promise<string> {
    await assertOwnsCharacter(this.characterRepository, characterId, userId, 'write');
    assertValidImage(file);

    const extension = file.type.split('/')[1];
    const path = sheetBackgroundPath(userId, characterId, this.newVersion(), extension);
    return this.storageRepository.upload(AVATAR_BUCKET, path, file);
  }
}
