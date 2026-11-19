import { NextResponse } from 'next/server';

import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';

import { getApi } from '@api';

import type { EmailLinkType } from '@backend/contexts/users/domain/auth.repo';

import { errorCode } from '@shared/http/error-response';

// Where each e-mail link lands once its token is verified. Fixed per type, never taken from the
// URL, so a crafted link can't send the new session anywhere else.
const DESTINATIONS: Record<EmailLinkType, string> = {
  signup: '/characters',
  recovery: '/reset-password',
  magiclink: '/characters',
};

function isEmailLinkType(type: string | null): type is EmailLinkType {
  return type !== null && Object.hasOwn(DESTINATIONS, type);
}

/**
 * `path` in the language the e-mail was asked in (`?locale=`), when it is one of ours. The proxy
 * saves a prefixed path's language in the NEXT_LOCALE cookie and drops the prefix, so the page
 * opens in that language even in a browser that never visited the site (another device, the mail
 * app). Without it the browser's language decides, as on any page.
 */
function inLocale(path: string, locale: string | null): string {
  return hasLocale(routing.locales, locale) ? `/${locale}${path}` : path;
}

/**
 * Redirects to the auth error page. `code` must be a key of `common.errors`, never raw text; the
 * link's `type` lets the page offer the right way to ask for a new one.
 */
function redirectToError(code: string, requestUrl: URL, type?: EmailLinkType) {
  const query = new URLSearchParams({ message: code });
  if (type) query.set('type', type);
  const path = inLocale(`/auth/error?${query}`, requestUrl.searchParams.get('locale'));
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

/** Target of the sign-up and password recovery e-mails: verifies the token and starts the session. */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (!tokenHash || !isEmailLinkType(type)) {
    return redirectToError(
      'no_code_provided',
      requestUrl,
      isEmailLinkType(type) ? type : undefined,
    );
  }

  try {
    const { authApi } = await getApi();
    await authApi.verifyEmailLink(tokenHash, type);
    const path = inLocale(DESTINATIONS[type], requestUrl.searchParams.get('locale'));
    return NextResponse.redirect(new URL(path, requestUrl.origin));
  } catch (err: unknown) {
    // Expected failures (e.g. expired or reused link) keep their code; anything else is logged
    // and shown as the generic error
    return redirectToError(errorCode(err), requestUrl, type);
  }
}
