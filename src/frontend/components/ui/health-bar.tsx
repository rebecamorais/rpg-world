import * as React from 'react';

import { cn } from '@frontend/lib/utils';

export interface HealthBarProps extends React.ComponentProps<'div'> {
  current: number;
  max: number;
  temp?: number;
}

export function HealthBar({ current, max, temp = 0, className, ...props }: HealthBarProps) {
  // Avoid division by zero
  const safeMax = max > 0 ? max : 1;
  const hpPercentage = Math.min(100, Math.max(0, (current / safeMax) * 100));
  const tempHpPercentage = Math.min(100, Math.max(0, (temp / safeMax) * 100));

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} {...props}>
      {/* Main Track (The Rail) */}
      <div className="border-border bg-background relative h-3 w-full overflow-hidden rounded-full border shadow-inner">
        {/* 1. Normal HP Bar */}
        <div
          className="from-danger-flare to-danger absolute top-0 left-0 z-10 h-full bg-gradient-to-b shadow-[0_0_12px_var(--danger-muted)] transition-all duration-700 ease-in-out"
          style={{ width: `${hpPercentage}%` }}
        >
          {/* Highlight */}
          <div className="from-foreground/20 absolute inset-0 bg-gradient-to-b to-transparent" />
        </div>

        {/* 2. Temp HP Bar, striped to tell it apart */}
        {temp > 0 && (
          <div
            className="from-warning-muted to-warning absolute top-0 z-20 h-full bg-gradient-to-b shadow-[0_0_15px_var(--warning)] transition-all duration-700 ease-in-out"
            style={{ width: `${tempHpPercentage}%` }}
          >
            <div className="bg-stripes text-foreground absolute inset-0 opacity-20" />
            <div className="from-foreground/30 absolute inset-0 bg-gradient-to-b to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
