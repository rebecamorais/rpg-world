'use client';

import {
  type ErrorBoundaryProps,
  UnexpectedError,
} from '@frontend/components/shared/UnexpectedError';

/** A dashboard page failed: the error shows in its place, the sidebar stays. */
export default function DashboardError(props: ErrorBoundaryProps) {
  return <UnexpectedError {...props} />;
}
