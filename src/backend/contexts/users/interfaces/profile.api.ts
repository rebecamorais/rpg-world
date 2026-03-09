import { Profile } from '../domain/Profile';
import { UserContext } from '../index';

export const makeProfileApi = (userContext: UserContext) => ({
  getProfile: async (id: string): Promise<Profile | null> => {
    return userContext.getProfile.execute(id);
  },

  updateProfile: async (profile: Profile): Promise<void> => {
    await userContext.updateProfile.execute(profile);
  },
});
