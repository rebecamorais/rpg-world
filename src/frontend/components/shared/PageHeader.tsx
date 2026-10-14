'use client';

import { ReactNode } from 'react';

import { AppIcon, IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface PageHeaderProps {
  icon: IconName;
  title: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Header of a character sheet tab. It is the only sticky element of the page: fixed height,
 * so the content below doesn't jump when the actions load.
 */
export function PageHeader({ icon, title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-background/80 border-border sticky top-0 z-30 -mx-4 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-md md:h-16 md:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="border-border bg-muted flex h-10 w-10 flex-none items-center justify-center rounded-lg border">
          <AppIcon name={icon} size={16} className="text-character-flare" aria-hidden="true" />
        </div>
        <h1 className="text-label text-foreground truncate md:text-sm">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">{actions}</div>
    </header>
  );
}
