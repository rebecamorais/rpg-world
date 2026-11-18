import { getApi } from '@api';

import { updatePasswordSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { siteUrl } from '@backend/shared/infrastructure/helpers/site-url';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ user, body }) => {
    // The current password is checked by signing in with the e-mail, which also gets the notice
    if (!user.email) {
      throw new Error('Session without e-mail cannot change the password');
    }

    const { authApi } = await getApi();
    return authApi.updatePassword(
      { userId: user.id, email: user.email, ...body },
      // The notice's "it wasn't me" link; the proxy picks the language
      `${siteUrl()}/forgot-password`,
    );
  },
  { body: updatePasswordSchema },
);
