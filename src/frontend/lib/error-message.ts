/** Minimal shape of a next-intl translator scoped to `common`. */
interface CommonTranslator {
  (key: string): string;
  has: (key: string) => boolean;
}

/** Code (under `common.errors`) of a request that never reached the server. */
export const NETWORK_ERROR = 'common_error_network';

/**
 * Whether `err` is a request that never got an answer: offline, or the connection dropped. fetch
 * rejects with a TypeError then, worded differently by each browser ("Failed to fetch",
 * "NetworkError when attempting to fetch resource.", "Load failed"). An APIError (it has the
 * answer's `status`) always had an answer, so it never counts. Checked by shape, not instanceof:
 * tests that mock the API client leave the class out.
 */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error) || typeof (err as { status?: unknown }).status === 'number') {
    return false;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return err instanceof TypeError && /fetch|network|load failed/i.test(err.message);
}

/**
 * Candidate error code of a thrown error. Our API and server actions carry the code in
 * `Error.message` (see `APIError`); any other message is not a known code and is never shown,
 * because `translateErrorCode` falls back to the generic message. A request that never reached
 * the server gets NETWORK_ERROR, so the person knows it's the connection.
 */
export function errorCodeOf(err: unknown): string | undefined {
  if (isNetworkError(err)) return NETWORK_ERROR;
  return err instanceof Error ? err.message : undefined;
}

/** Translates an error code from `common.errors`; unknown or missing codes get the generic message. */
export function translateErrorCode(t: CommonTranslator, code: string | null | undefined): string {
  if (code && t.has(`errors.${code}`)) {
    return t(`errors.${code}`);
  }
  return t('errors.unknown');
}
