import { Profile } from './Profile';

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>;
  create(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
