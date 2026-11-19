import { errorCodeOf, isNetworkError } from '@frontend/lib/error-message';

/** Code (under `common.errors`) of a sign-in or e-mail request that never reached the server. */
const AUTH_NETWORK_ERROR = 'common_error_offline';

/**
 * Error code of a failed sign-in, sign-up or e-mail request. Same as `errorCodeOf`, except that a
 * request that never got an answer says to check the connection: the usual network message
 * ("Nothing was saved") is about saving, which doesn't fit signing in or asking for a link.
 */
export function authErrorCodeOf(err: unknown): string | undefined {
  return isNetworkError(err) ? AUTH_NETWORK_ERROR : errorCodeOf(err);
}
