import { getApi } from '@api';

import { signInWithPasswordSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { clientIp } from '@shared/http/client-ip';
import { withHandler } from '@shared/http/route-handler';

export const POST = withHandler(
  async ({ req, body }) => {
    const { authApi } = await getApi();
    return authApi.signInWithPassword(body.email, body.password, clientIp(req));
  },
  { body: signInWithPasswordSchema },
);
