'use client';

import * as React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { cn } from '@frontend/lib/utils';

interface GhostInputProps extends React.ComponentProps<typeof Input> {
  showIcon?: boolean;
  containerClassName?: string;
  useThemeColor?: boolean;
}

const GhostInput = React.forwardRef<HTMLInputElement, GhostInputProps>(
  (
    { className, containerClassName, showIcon = true, useThemeColor = false, style, ...props },
    ref,
  ) => {
    return (
      <div className={cn('group relative flex items-center', containerClassName)}>
        <Input
          ref={ref}
          style={{ color: useThemeColor ? 'var(--character-color)' : undefined, ...style }}
          className={cn(
            'focus-visible:ring-primary/50 h-7 border-none bg-transparent p-0 shadow-none transition-all focus-visible:px-2 focus-visible:ring-2 disabled:cursor-default',
            className,
            showIcon && 'pr-5',
          )}
          {...props}
        />
        {showIcon && (
          <AppIcon
            name="Pencil"
            size={12}
            className={cn(
              'text-muted-foreground pointer-events-none absolute right-0 opacity-0 transition-opacity group-focus-within:hidden group-hover:opacity-100',
            )}
          />
        )}
      </div>
    );
  },
);

GhostInput.displayName = 'GhostInput';

export { GhostInput };
