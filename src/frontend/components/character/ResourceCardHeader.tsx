import * as React from 'react';

import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/**
 * Header of the resource cards side by side in the combat card (HP, spell slots, spell points).
 * One shape for all, so their titles line up: the icon carries the resource's color, the title is
 * a label like every section title.
 */
export function ResourceCardHeader({
  icon,
  iconVariant,
  iconClassName,
  title,
  badge,
  action,
}: {
  icon: IconName;
  iconVariant?: React.ComponentProps<typeof AppIcon>['variant'];
  /** The resource's color, e.g. `text-danger-flare`. */
  iconClassName: string;
  title: React.ReactNode;
  /** Shown before the action, e.g. "7 / 7". */
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-7 items-center justify-between gap-2">
      <div className="text-label text-muted-foreground flex items-center gap-2">
        <AppIcon
          name={icon}
          variant={iconVariant}
          size={iconVariant === 'game' ? 'sm' : 16}
          className={cn('shrink-0', iconClassName)}
          aria-hidden="true"
        />
        {title}
      </div>
      <div className="flex items-center gap-1">
        {badge}
        {action}
      </div>
    </div>
  );
}
