'use client';

import {
  type ErrorBoundaryProps,
  UnexpectedError,
} from '@frontend/components/shared/UnexpectedError';

/** A public page failed: the error inside the site's header and footer (the layout's main). */
export default function PublicError(props: ErrorBoundaryProps) {
  return <UnexpectedError {...props} />;
}
