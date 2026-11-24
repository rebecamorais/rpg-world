'use client';

import {
  type ErrorBoundaryProps,
  UnexpectedError,
} from '@frontend/components/shared/UnexpectedError';

/**
 * An (app) page or the dashboard layout failed: the error between the header and the footer.
 * The (app) layout leaves the main landmark to the sections below it, so this one brings it.
 */
export default function AppError(props: ErrorBoundaryProps) {
  return <UnexpectedError {...props} main />;
}
