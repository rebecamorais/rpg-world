import * as React from 'react';

import { cn } from '@frontend/lib/utils';

function Input({ className, type, inputMode, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      // Number pad on phones; pass inputMode="decimal" for fractional values
      inputMode={inputMode ?? (type === 'number' ? 'numeric' : undefined)}
      className={cn(
        'border-input file:text-foreground placeholder:text-placeholder focus-ring aria-invalid:border-danger flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
