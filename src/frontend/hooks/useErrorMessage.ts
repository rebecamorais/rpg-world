import { useTranslations } from 'next-intl';

import { errorCodeOf, translateErrorCode } from '@frontend/lib/error-message';

/**
 * Translates error codes returned by the backend (keys of `common.errors`).
 * Unknown codes and unexpected errors show the generic `common.errors.unknown` message.
 */
export function useErrorMessage() {
  const t = useTranslations('common');

  const getMessage = (errorCode: string | null | undefined): string =>
    translateErrorCode(t, errorCode);

  /** Message for an error thrown by the API client or a mutation. */
  const getErrorMessage = (err: unknown): string => getMessage(errorCodeOf(err));

  return { getMessage, getErrorMessage };
}
