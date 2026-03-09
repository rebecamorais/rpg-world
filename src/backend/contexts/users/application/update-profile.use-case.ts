import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/ProfileRepository';

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(profile: Profile): Promise<void> {
    if (!profile.id) {
      throw new Error('Profile ID is required');
    }

    await this.profileRepository.update(profile);
  }
}

export class GetProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(id: string): Promise<Profile | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    return this.profileRepository.getById(id);
  }
}
