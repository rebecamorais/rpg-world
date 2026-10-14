'use client';

import { ReactNode } from 'react';

import { IconName } from '@frontend/components/ui/icon';

import { PageHeader } from './PageHeader';

interface PageContainerProps {
  icon: IconName;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

/**
 * Standardized container for character sheet pages.
 * Ensures the PageHeader is always present and content below doesn't 'jump' when actions load.
 */
export function PageContainer({ icon, title, actions, children, loading }: PageContainerProps) {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <PageHeader icon={icon} title={title} actions={!loading ? actions : null} />

      {/* Content Area */}
      <main className="animate-in fade-in min-h-0 w-full flex-1 duration-500">{children}</main>
    </div>
  );
}
