import * as React from 'react';

import { cn } from '@frontend/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'border-input bg-background placeholder:text-placeholder focus-ring aria-invalid:border-danger flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
