'use client';

import {
  type ErrorBoundaryProps,
  UnexpectedError,
} from '@frontend/components/shared/UnexpectedError';

/**
 * A section's layout failed (the header reads the session, the demo loads its data): no header or
 * footer left, only the root layout, so the error brings the main landmark. A failure of the root
 * layout itself falls to app/global-error.tsx.
 */
export default function LocaleError(props: ErrorBoundaryProps) {
  return <UnexpectedError {...props} main />;
}
