import { getApi } from '@api';

import { signInWithPasswordSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { withHandler } from '@shared/http/route-handler';

export const POST = withHandler(
  async ({ body }) => {
    const { authApi } = await getApi();
    return authApi.signInWithPassword(body.email, body.password);
  },
  { body: signInWithPasswordSchema },
);
