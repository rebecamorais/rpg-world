import { StorageRepository } from '@backend/shared/domain/StorageRepository';

export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class UploadAvatarUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

  async execute(userId: string, file: Blob): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('File size exceeds the 5 MB limit');
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WEBP');
    }

    const extension = file.type.split('/')[1];
    const path = `${userId}/avatar.${extension}`;

    const publicUrl = await this.storageRepository.upload(AVATAR_BUCKET, path, file);

    return publicUrl;
  }
}
