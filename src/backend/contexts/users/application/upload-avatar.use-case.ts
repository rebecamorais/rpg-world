import { AssetVersionGenerator, newAssetVersion } from '@backend/shared/domain/asset-version';
import {
  ALLOWED_AVATAR_TYPES,
  AVATAR_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
  hasImageSignature,
} from '@backend/shared/domain/avatar';
import { StorageRepository } from '@backend/shared/domain/storage.repo';

import { UserError, UserErrorCodes } from '../domain/UserError';

export class UploadAvatarUseCase {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly newVersion: AssetVersionGenerator = newAssetVersion,
  ) {}

  async execute(userId: string, file: Blob): Promise<string> {
    if (!userId) {
      throw new UserError(UserErrorCodes.AVATAR_UPLOAD_USERID_REQUIRED);
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new UserError(UserErrorCodes.AVATAR_UPLOAD_SIZE_LIMIT);
    }

    // The declared type comes from the file name; the first bytes say what it really is
    if (!ALLOWED_AVATAR_TYPES.includes(file.type) || !(await hasImageSignature(file))) {
      throw new UserError(UserErrorCodes.AVATAR_UPLOAD_INVALID_TYPE);
    }

    // Versioned path: the proxy lets images be cached, so each upload needs a new URL.
    // The previous file stays until the new URL is saved on the profile (right after the upload),
    // which removes the file it replaces.
    const extension = file.type.split('/')[1];
    const path = `${userId}/avatar-${this.newVersion()}.${extension}`;

    return this.storageRepository.upload(AVATAR_BUCKET, path, file);
  }
}
