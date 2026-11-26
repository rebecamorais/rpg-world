import { isFileIn, removeReplacedAsset } from '@backend/shared/application/remove-replaced-asset';
import { AVATAR_BUCKET } from '@backend/shared/domain/avatar';
import { StorageRepository } from '@backend/shared/domain/storage.repo';

import { USERNAME_PATTERN } from '@shared/auth/username-policy';

import { Profile } from '../domain/Profile';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { ProfileRepository } from '../domain/profile.repo';

export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storageRepository?: StorageRepository,
    /** Path in `bucket` of a URL on this environment's asset host, or null (`ownAssetPath`). */
    private readonly ownAssetPath: (url: string, bucket: string) => string | null = () => null,
  ) {}

  async execute(profile: Profile): Promise<void> {
    if (!profile.id) {
      throw new UserError(UserErrorCodes.PROFILE_UPDATE_ID_REQUIRED);
    }

    const { avatarUrl, username } = profile;
    const previous =
      avatarUrl !== undefined || username !== undefined
        ? await this.profileRepository.getById(profile.id)
        : null;

    // Only a new username has to follow the rule: one saved before it, sent back as it is (the
    // profile form sends it with every save), keeps working
    if (
      username !== undefined &&
      username !== previous?.username &&
      !USERNAME_PATTERN.test(username)
    ) {
      throw new UserError(UserErrorCodes.PROFILE_USERNAME_INVALID);
    }

    // Empty (no picture), the one it already has (a Google picture) or one this account uploaded:
    // any other URL would show someone else's file, or a tracker, as this person's picture
    if (
      avatarUrl &&
      avatarUrl !== previous?.avatarUrl &&
      !this.isOwnAvatar(profile.id, avatarUrl)
    ) {
      throw new UserError(UserErrorCodes.PROFILE_AVATAR_INVALID);
    }

    await this.profileRepository.update(profile);

    if (this.storageRepository && previous && avatarUrl !== undefined) {
      // Only the files UploadAvatarUseCase creates: `<userId>/avatar-<version>.<ext>`
      await removeReplacedAsset(
        this.storageRepository,
        AVATAR_BUCKET,
        previous.avatarUrl,
        profile.avatarUrl,
        (path) => isFileIn(path, profile.id, 'avatar-'),
      );
    }
  }

  /** The bucket right after the host, as the character images (UpdateCharacterUseCase). */
  private isOwnAvatar(userId: string, url: string): boolean {
    const path = this.ownAssetPath(url, AVATAR_BUCKET);
    return !!path && isFileIn(path, userId, 'avatar-');
  }
}
