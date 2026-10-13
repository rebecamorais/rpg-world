/** Minimal shape of a next-intl translator scoped to `common`. */
interface CommonTranslator {
  (key: string): string;
  has: (key: string) => boolean;
}

/**
 * Candidate error code of a thrown error. Our API and server actions carry the code in
 * `Error.message` (see `APIError`); any other message is not a known code and is never shown,
 * because `translateErrorCode` falls back to the generic message.
 */
export function errorCodeOf(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

/** Translates an error code from `common.errors`; unknown or missing codes get the generic message. */
export function translateErrorCode(t: CommonTranslator, code: string | null | undefined): string {
  if (code && t.has(`errors.${code}`)) {
    return t(`errors.${code}`);
  }
  return t('errors.unknown');
}
