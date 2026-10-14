import * as React from 'react';

import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface StateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  icon?: IconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A call to action, such as a Button. */
  action?: React.ReactNode;
}

/** Nothing to show yet: what is missing and how to start. */
function EmptyState({ icon, title, description, action, className, ...props }: StateProps) {
  return (
    <div
      className={cn(
        'border-border bg-card/40 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="bg-muted text-muted-foreground mb-1 flex h-14 w-14 items-center justify-center rounded-full">
          <AppIcon name={icon} size={28} aria-hidden="true" />
        </div>
      )}
      <p className="text-heading text-foreground">{title}</p>
      {description && (
        <p className="text-body text-muted-foreground max-w-sm text-balance">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Something failed: announced to screen readers, with an optional way to retry. */
function ErrorState({
  icon = 'TriangleAlert',
  title,
  description,
  action,
  className,
  ...props
}: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'border-danger-muted bg-danger-surface flex items-start gap-3 rounded-xl border p-4',
        className,
      )}
      {...props}
    >
      <AppIcon name={icon} size={20} className="text-danger-flare mt-0.5 shrink-0" aria-hidden />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-heading text-foreground">{title}</p>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export { EmptyState, ErrorState };
