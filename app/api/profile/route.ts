import { getApi } from '@api';
import { Profile } from '@backend/contexts/users/domain/Profile';
import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (user) => {
  const { profileApi } = await getApi();
  return profileApi.getProfile(user.id);
});

export const PATCH = withAuth<Partial<Profile>>(async (user, body) => {
  const { profileApi } = await getApi();
  await profileApi.updateProfile({ ...body, id: user.id });
});
