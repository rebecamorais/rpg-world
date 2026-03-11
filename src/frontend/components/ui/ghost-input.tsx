'use client';

import * as React from 'react';

import { Pencil } from 'lucide-react';

import { Input } from '@frontend/components/ui/input';
import { cn } from '@frontend/lib/utils';

interface GhostInputProps extends React.ComponentProps<typeof Input> {
  showIcon?: boolean;
  containerClassName?: string;
}

const GhostInput = React.forwardRef<HTMLInputElement, GhostInputProps>(
  ({ className, containerClassName, showIcon = true, ...props }, ref) => {
    return (
      <div className={cn('group relative flex items-center', containerClassName)}>
        <Input
          ref={ref}
          className={cn(
            'focus-visible:ring-primary/50 h-auto border-none bg-transparent p-0 shadow-none transition-colors focus-visible:ring-1 disabled:cursor-default',
            showIcon && 'pr-6',
            className,
          )}
          {...props}
        />
        {showIcon && (
          <Pencil
            className={cn(
              'text-muted-foreground pointer-events-none absolute h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100',
              'right-2',
            )}
          />
        )}
      </div>
    );
  },
);

GhostInput.displayName = 'GhostInput';

export { GhostInput };
