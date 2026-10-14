import { NextResponse } from 'next/server';

import { getApi } from '@api';

import { UserErrorCodes } from '@backend/contexts/users/domain/UserError';
import { safeRedirectPath } from '@backend/shared/infrastructure/helpers/safe-redirect-path';

import { errorCode } from '@shared/http/error-response';

// Error codes Supabase sends back when an e-mail link expired or was already used
const EXPIRED_LINK_CODES = new Set(['otp_expired', 'flow_state_expired', 'flow_state_not_found']);

/** Redirects to the auth error page. `code` must be a key of `common.errors`, never raw text. */
function redirectToError(code: string, origin: string) {
  return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(code)}`, origin));
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeRedirectPath(
    requestUrl.searchParams.get('next'),
    requestUrl.origin,
    '/characters',
  );

  const error = requestUrl.searchParams.get('error');
  const providerErrorCode = requestUrl.searchParams.get('error_code');

  if (error || providerErrorCode) {
    return redirectToError(
      EXPIRED_LINK_CODES.has(providerErrorCode ?? '')
        ? UserErrorCodes.AUTH_LINK_EXPIRED
        : UserErrorCodes.AUTH_PROVIDER_ERROR,
      requestUrl.origin,
    );
  }

  if (!code) {
    return redirectToError('no_code_provided', requestUrl.origin);
  }

  try {
    const { authApi } = await getApi();
    await authApi.callbackExchange(code);

    // Redirect to the intended page or default system dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (err: unknown) {
    // Expected failures (e.g. expired link) keep their code; anything else is logged
    // and shown as the generic error
    return redirectToError(errorCode(err), requestUrl.origin);
  }
}
