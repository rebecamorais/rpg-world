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
        <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
          {/* 1. Barra de HP Normal */}
          <div
            className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-500 ease-in-out"
            style={{ width: `${Math.min(hpPercentage, 100)}%`, zIndex: 10 }}
          />

          {/* 2. Barra de Temp HP */}
          {temp > 0 && (
            <div
              className="absolute top-0 h-full bg-yellow-400 opacity-90 shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-500 ease-in-out"
              style={{
                width: `${tempHpPercentage}%`,
                zIndex: 20,
              }}
            />
          )}
        </div>
      </div>
    );
  },
);
HealthBar.displayName = 'HealthBar';
