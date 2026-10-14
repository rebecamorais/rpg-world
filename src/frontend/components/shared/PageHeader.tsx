import { ReactNode } from 'react';

import { AppIcon, IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small line above the title: where you are (a sheet tab) or a way back. */
  eyebrow?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  titleClassName?: string;
}

/**
 * The top of every dashboard page, in the same place and with the same type: the page's only
 * h1, an optional eyebrow and description, and actions on the right.
 * Below it, sections use h2 (SectionCard.Title) and their parts h3.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  titleClassName,
}: PageHeaderProps) {
  return (
    <header className="border-border flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b pb-6">
      <div className="flex min-w-0 flex-col gap-2">
        {(eyebrow || icon) && (
          <div className="text-label text-muted-foreground flex items-center gap-2">
            {icon && (
              <AppIcon name={icon} size={14} className="text-character-flare" aria-hidden="true" />
            )}
            {eyebrow}
          </div>
        )}
        <h1 className={cn('text-display text-foreground break-words', titleClassName)}>{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground max-w-prose">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
