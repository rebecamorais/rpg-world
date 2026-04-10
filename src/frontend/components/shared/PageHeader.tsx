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
 * Standardized PageHeader for character sheet tabs.
 * Implements the requested aesthetics: backdrop-blur, border-b, and character color integration.
 */
export function PageHeader({ icon, title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-background/80 sticky top-0 z-20 -mx-4 flex h-14 items-center justify-between border-b border-white/5 px-4 backdrop-blur-md md:h-16 md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-white/5 bg-white/5">
          <AppIcon name={icon} size={16} className="text-character-flare" />
        </div>
        <h1 className="text-xs font-bold tracking-[0.2em] uppercase opacity-90 md:text-sm">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">{actions}</div>
    </header>
  );
}
