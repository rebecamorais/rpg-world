import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@frontend/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export interface SpinnerProps
  extends React.SVGProps<SVGSVGElement>, VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size, className }))} {...props} />;
}
