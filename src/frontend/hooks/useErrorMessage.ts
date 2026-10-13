import { useCallback } from 'react';

import { useTranslations } from 'next-intl';

import { errorCodeOf, translateErrorCode } from '@frontend/lib/error-message';

/**
 * Translates error codes returned by the backend (keys of `common.errors`).
 * Unknown codes and unexpected errors show the generic `common.errors.unknown` message.
 */
export function useErrorMessage() {
  const t = useTranslations('common');

  const getMessage = useCallback(
    (errorCode: string | null | undefined): string => translateErrorCode(t, errorCode),
    [t],
  );

  /** Message for an error thrown by the API client or a mutation. */
  const getErrorMessage = useCallback(
    (err: unknown): string => getMessage(errorCodeOf(err)),
    [getMessage],
  );

  return { getMessage, getErrorMessage };
}
