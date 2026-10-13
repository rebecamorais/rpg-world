import { getApi } from '@api';

import { updateProfileSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async ({ user }) => {
  const { profileApi } = await getApi();
  return profileApi.getProfile(user.id);
});

export const PATCH = withAuth(
  async ({ user, body }) => {
    const { profileApi } = await getApi();
    await profileApi.updateProfile({ ...body, id: user.id });
  },
  { body: updateProfileSchema },
);
