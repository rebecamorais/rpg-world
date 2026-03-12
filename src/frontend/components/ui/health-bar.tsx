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
        {/* Container Principal (O "Trilho") */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-zinc-900/50">
          {/* 1. Barra de HP Normal */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-500 ease-in-out"
            style={{ width: `${Math.min(hpPercentage, 100)}%`, zIndex: 10 }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1),transparent)]" />
          </div>

          {/* 2. Barra de Temp HP */}
          {temp > 0 && (
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.5)] transition-all duration-500 ease-in-out"
              style={{
                width: `${tempHpPercentage}%`,
                zIndex: 20,
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)]" />
            </div>
          )}
        </div>
      </div>
    );
  },
);
HealthBar.displayName = 'HealthBar';
