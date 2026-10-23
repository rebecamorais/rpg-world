import { isFileIn, removeReplacedAsset } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';

import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/ProfileRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storageRepository?: StorageRepository,
  ) {}

  async execute(profile: Profile): Promise<void> {
    if (!profile.id) {
      throw new UserError(UserErrorCodes.PROFILE_UPDATE_ID_REQUIRED);
    }

    const storage = profile.avatarUrl !== undefined ? this.storageRepository : undefined;
    const previous = storage ? await this.profileRepository.getById(profile.id) : null;

    await this.profileRepository.update(profile);

    if (storage && previous) {
      // Only the files UploadAvatarUseCase creates: `<userId>/avatar-<version>.<ext>`
      await removeReplacedAsset(
        storage,
        AVATAR_BUCKET,
        previous.avatarUrl,
        profile.avatarUrl,
        (path) => isFileIn(path, profile.id, 'avatar-'),
      );
    }
  }
}
