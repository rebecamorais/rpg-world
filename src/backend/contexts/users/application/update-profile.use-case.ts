import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/ProfileRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(profile: Profile): Promise<void> {
    if (!profile.id) {
      throw new UserError(UserErrorCodes.PROFILE_UPDATE_ID_REQUIRED);
    }

    await this.profileRepository.update(profile);
  }
}

export class GetProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(id: string): Promise<Profile | null> {
    if (!id) {
      throw new UserError(UserErrorCodes.PROFILE_GET_ID_REQUIRED);
    }

    return this.profileRepository.getById(id);
  }
}
