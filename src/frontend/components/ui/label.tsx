import * as React from 'react';

import { cn } from '@/frontend/lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          'mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Label.displayName = 'Label';

export { Label };
