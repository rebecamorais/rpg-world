import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@frontend/lib/utils';

const spinnerVariants = cva('inline-block', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    },
    variant: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      current: 'text-current',
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'current',
  },
});

export interface SpinnerProps
  extends React.ComponentPropsWithoutRef<'svg'>, VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, variant, ...props }: SpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={cn(spinnerVariants({ size, variant, className }))}
      {...props}
    >
      <path
        fill="currentColor"
        d="M2,12A11.2,11.2,0,0,1,13,1.05C12.67,1,12.34,1,12,1a11,11,0,0,0,0,22c.34,0,.67,0,1-.05C6,23,2,17.74,2,12Z"
      >
        <animateTransform
          attributeName="transform"
          dur="0.6s"
          repeatCount="indefinite"
          type="rotate"
          values="0 12 12;360 12 12"
        />
      </path>
    </svg>
  );
}
