import { getApi } from '@api';

import { updatePasswordSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ body }) => {
    const { authApi } = await getApi();
    return authApi.updatePassword(body.newPassword);
  },
  { body: updatePasswordSchema },
);
