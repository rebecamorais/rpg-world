'use client';

import * as React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { cn } from '@frontend/lib/utils';

interface GhostInputProps extends React.ComponentProps<typeof Input> {
  showIcon?: boolean;
  containerClassName?: string;
}

/**
 * Input that looks like plain text until it is focused, for inline editing on the sheet.
 * Input sets `text-base md:text-sm`, so a custom size needs its md: twin too (`text-5xl md:text-5xl`).
 */
function GhostInput({ className, containerClassName, showIcon = true, ...props }: GhostInputProps) {
  return (
    <div className={cn('group relative m-0 flex items-center', containerClassName)}>
      <Input
        className={cn(
          'no-spinner h-7 border-none bg-transparent p-0 shadow-none transition-all focus-visible:px-2 disabled:cursor-default',
          className,
          showIcon && 'pr-5',
        )}
        {...props}
      />
      {showIcon && (
        <AppIcon
          name="Pencil"
          size={14}
          className="text-muted-foreground pointer-events-none absolute right-0 opacity-0 transition-opacity group-focus-within:hidden group-hover:opacity-100"
        />
      )}
    </div>
  );
}

export { GhostInput };
