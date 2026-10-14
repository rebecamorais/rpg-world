import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@frontend/lib/utils';

const badgeVariants = cva(
  'focus-ring inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-on border-transparent shadow',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        destructive: 'bg-destructive text-destructive-foreground border-transparent shadow',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
