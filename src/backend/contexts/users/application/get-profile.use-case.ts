import { Profile } from '../domain/Profile';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { ProfileRepository } from '../domain/profile.repo';

export class GetProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(id: string): Promise<Profile | null> {
    if (!id) {
      throw new UserError(UserErrorCodes.PROFILE_GET_ID_REQUIRED);
    }

    return this.profileRepository.getById(id);
  }
}
