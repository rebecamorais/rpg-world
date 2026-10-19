import { NextResponse } from 'next/server';

import { getApi } from '@api';

import type { EmailLinkType } from '@backend/contexts/users/domain/AuthRepository';

import { errorCode } from '@shared/http/error-response';

// Where each e-mail link lands once its token is verified. Fixed per type, never taken from the
// URL, so a crafted link can't send the new session anywhere else.
const DESTINATIONS: Record<EmailLinkType, string> = {
  signup: '/characters',
  recovery: '/reset-password',
};

function isEmailLinkType(type: string | null): type is EmailLinkType {
  return type !== null && Object.hasOwn(DESTINATIONS, type);
}

/** Redirects to the auth error page. `code` must be a key of `common.errors`, never raw text. */
function redirectToError(code: string, origin: string) {
  return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(code)}`, origin));
}

/** Target of the sign-up and password recovery e-mails: verifies the token and starts the session. */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (!tokenHash || !isEmailLinkType(type)) {
    return redirectToError('no_code_provided', requestUrl.origin);
  }

  try {
    const { authApi } = await getApi();
    await authApi.verifyEmailLink(tokenHash, type);
    return NextResponse.redirect(new URL(DESTINATIONS[type], requestUrl.origin));
  } catch (err: unknown) {
    // Expected failures (e.g. expired or reused link) keep their code; anything else is logged
    // and shown as the generic error
    return redirectToError(errorCode(err), requestUrl.origin);
  }
}
