import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AssetVersionGenerator, newAssetVersion } from '@backend/shared/domain/asset-version';
import {
  ALLOWED_AVATAR_TYPES,
  AVATAR_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
} from '@backend/shared/domain/avatar';

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

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      throw new UserError(UserErrorCodes.AVATAR_UPLOAD_INVALID_TYPE);
    }

    // Versioned path: the proxy lets images be cached, so each upload needs a new URL.
    // The previous file is kept because the new URL is only saved when the profile form is.
    const extension = file.type.split('/')[1];
    const path = `${userId}/avatar-${this.newVersion()}.${extension}`;

    return this.storageRepository.upload(AVATAR_BUCKET, path, file);
  }
}
