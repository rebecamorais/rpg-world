import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';

import { getApi } from '@api';

import { accountDeletionRequestSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { siteUrl } from '@backend/shared/infrastructure/helpers/site-url';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ req, user, body }) => {
    if (!user.email) {
      throw new Error('Session without e-mail cannot request account deletion');
    }

    const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
    const locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;

    const { authApi } = await getApi();
    await authApi.requestAccountDeletion(
      { userId: user.id, email: user.email, ...body },
      `${siteUrl()}/${locale}/delete-account`,
    );
  },
  { body: accountDeletionRequestSchema },
);
