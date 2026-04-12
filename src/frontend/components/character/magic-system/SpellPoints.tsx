'use client';

import * as React from 'react';

import { Card } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  max: number;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  systemSelector: React.ReactNode;
}

export const SpellPoints = React.forwardRef<HTMLDivElement, Props>(
  ({ current, max, onPointsChange, systemSelector, className, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));

    return (
      <Card
        ref={ref}
        className={cn(
          'group border-border bg-card/50 hover:bg-card relative flex min-h-[160px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
          <AppIcon name="Droplet" size={14} className="text-blue-500" />
          {systemSelector}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-1">
          <div className="flex items-baseline justify-center gap-1.5 font-bold">
            <div className="group/value relative flex items-baseline">
              <GhostInput
                type="number"
                value={current}
                onChange={(e) => onPointsChange('current', parseInt(e.target.value) || 0)}
                className="h-auto w-16 p-0 text-center text-3xl font-black text-white outline-none"
              />
            </div>

            <div className="flex items-baseline gap-1 font-bold">
              <span className="text-muted-foreground text-sm opacity-30">/</span>
              <span className="text-muted-foreground text-sm opacity-30">{max}</span>
            </div>
          </div>

          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full border border-white/5 bg-zinc-900/50">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-500 ease-in-out"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(to right, var(--blue-muted), var(--blue-flare))`,
                boxShadow: '0 0 10px var(--blue-glow)',
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1),transparent)]" />
            </div>
          </div>
        </div>
      </Card>
    );
  },
);

SpellPoints.displayName = 'SpellPoints';
