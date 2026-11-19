import { getLocale } from 'next-intl/server';
import 'server-only';

import { siteUrl } from '@backend/shared/infrastructure/helpers/site-url';

/**
 * Where the links in auth e-mails land: the confirm route, told the language the e-mail was asked
 * in, so the page it opens is in that language even on a browser without the language cookie.
 * The route only accepts one of ours (`routing.locales`).
 */
export async function emailConfirmUrl(): Promise<string> {
  // Plain concatenation, as before: the auth repository adds the token with URL.searchParams
  return `${siteUrl()}/api/auth/confirm?locale=${encodeURIComponent(await getLocale())}`;
}
