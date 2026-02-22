import * as React from 'react';

import { cn } from '@/frontend/lib/utils';

export type SingleSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const SingleSelect = React.forwardRef<HTMLSelectElement, SingleSelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          'focus-visible:ring-primary w-full rounded-md border border-zinc-300 bg-white px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none dark:border-zinc-600 dark:bg-zinc-800',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
SingleSelect.displayName = 'SingleSelect';

export { SingleSelect };
