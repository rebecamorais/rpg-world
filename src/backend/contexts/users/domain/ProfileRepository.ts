import { Profile } from './Profile';

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>;
  update(profile: Profile): Promise<void>;
}
