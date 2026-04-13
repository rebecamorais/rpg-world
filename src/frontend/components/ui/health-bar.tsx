import * as React from 'react';

import { cn } from '@frontend/lib/utils';

export interface HealthBarProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  max: number;
  temp?: number;
}

export const HealthBar = React.forwardRef<HTMLDivElement, HealthBarProps>(
  ({ current, max, temp = 0, className, ...props }, ref) => {
    // Avoid division by zero
    const safeMax = max > 0 ? max : 1;
    const hpPercentage = Math.min(100, Math.max(0, (current / safeMax) * 100));
    const tempHpPercentage = Math.min(100, Math.max(0, (temp / safeMax) * 100));

    return (
      <div ref={ref} className={cn('flex w-full flex-col gap-1.5', className)} {...props}>
        {/* Main Track (The Rail) */}
        <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/5 bg-zinc-950/80 shadow-inner">
          {/* 1. Normal HP Bar */}
          <div
            className="absolute top-0 left-0 h-full transition-all duration-700 ease-in-out"
            style={{
              width: `${Math.min(hpPercentage, 100)}%`,
              zIndex: 10,
              background: `linear-gradient(to bottom, var(--red-flare), var(--red))`,
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 0 12px var(--red-muted)',
            }}
          >
            {/* Shimmer/Highlights */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          </div>

          {/* 2. Temp HP Bar */}
          {temp > 0 && (
            <div
              className="absolute top-0 h-full transition-all duration-700 ease-in-out"
              style={{
                width: `${tempHpPercentage}%`,
                zIndex: 20,
                background: `linear-gradient(to bottom, var(--yellow-muted), var(--yellow))`,
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 0 15px var(--yellow)',
              }}
            >
              {/* Pattern/Texture for Temp HP to distinguish it */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
                  backgroundSize: '8px 8px',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  },
);

HealthBar.displayName = 'HealthBar';
