import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { UserError, UserErrorCodes } from '../domain/UserError';

export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class UploadAvatarUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

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

    const path = `${userId}/avatar`;

    const publicUrl = await this.storageRepository.upload(AVATAR_BUCKET, path, file);

    return publicUrl;
  }
}
