import { ComponentProps, ReactNode } from 'react';

import { PageHeader } from './PageHeader';

interface PageContainerProps extends ComponentProps<typeof PageHeader> {
  children: ReactNode;
  /** Hides the actions while the page data loads, so they don't appear and vanish. */
  loading?: boolean;
}

/**
 * A dashboard page: PageHeader on top and the content below, with the same spacing on every
 * page. The outer frame (width, side and top padding) comes from the dashboard layout.
 */
export function PageContainer({ children, loading, actions, ...header }: PageContainerProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader {...header} actions={loading ? null : actions} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
