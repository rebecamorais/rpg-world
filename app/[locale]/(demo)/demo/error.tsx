'use client';

import {
  type ErrorBoundaryProps,
  UnexpectedError,
} from '@frontend/components/shared/UnexpectedError';

/**
 * A demo page failed: the error inside the demo's frame, so its header and navigation stay. The
 * frame already holds the main landmark. (The demo layout failing still goes to [locale]/error.)
 */
export default function DemoError(props: ErrorBoundaryProps) {
  return <UnexpectedError {...props} />;
}
