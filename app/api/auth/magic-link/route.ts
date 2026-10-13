import { getApi } from '@api';

import { magicLinkSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { withHandler } from '@shared/http/route-handler';

export const POST = withHandler(
  async ({ req, body }) => {
    const redirectTo = `${req.nextUrl.origin}/api/auth/callback`;
    const { authApi } = await getApi();
    await authApi.signInWithMagicLink(body.email, redirectTo);
    return { message: 'Magic link sent successfully' };
  },
  { body: magicLinkSchema },
);
