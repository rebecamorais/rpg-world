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

/** The HTTP status of an answer the server gave (an APIError), or nothing. Checked by shape. */
export function statusOf(err: unknown): number | undefined {
  const status = err instanceof Error ? (err as { status?: unknown }).status : undefined;
  return typeof status === 'number' ? status : undefined;
}

/** Answers that say "not now" rather than "no": too many requests, and a request that timed out. */
const TRANSIENT_STATUSES = new Set([408, 429]);

/**
 * Whether sending the very same request again can work: it never got an answer (the connection),
 * the server failed (5xx), or it asked to wait (408, 429). Any other answer (409 conflict, 404
 * gone, 400 invalid) would come back the same, so offering "Try again" there only fails twice.
 */
export function isRetryable(err: unknown): boolean {
  if (isNetworkError(err)) return true;
  const status = statusOf(err);
  return status !== undefined && (status >= 500 || TRANSIENT_STATUSES.has(status));
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
