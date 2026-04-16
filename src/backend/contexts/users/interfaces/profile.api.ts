import { Profile } from '../domain/Profile';
import { UserProfileContext } from '../index';

export const makeProfileApi = (profileContext: UserProfileContext) => ({
  getProfile: async (id: string) => {
    return profileContext.getProfile.execute(id);
  },

  updateProfile: async (profile: Profile) => {
    await profileContext.updateProfile.execute(profile);
    return { success: true };
  },

  uploadAvatar: async (userId: string, file: Blob) => {
    const avatarUrl = await profileContext.uploadAvatar.execute(userId, file);
    return { success: true, avatarUrl };
  },
});
