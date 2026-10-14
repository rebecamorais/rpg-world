'use client';

import * as React from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@frontend/lib/utils';

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

function Progress({ className, indicatorClassName, value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn('bg-muted relative h-4 w-full overflow-hidden rounded-full', className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('bg-primary h-full w-full flex-1 transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
