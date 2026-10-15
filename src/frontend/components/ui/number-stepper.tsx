'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberInput } from '@frontend/components/ui/number-input';
import { cn } from '@frontend/lib/utils';

export interface NumberStepperProps {
  /** Id of the number input, for an external `<Label htmlFor>`. */
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberStepper({
  id,
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  className,
  containerClassName,
  size = 'md',
}: NumberStepperProps) {
  const isSm = size === 'sm';
  const t = useTranslations('common');
  const withLabel = (action: string) => (label ? `${action}: ${label}` : action);

  return (
    <div className={cn('flex items-center justify-between gap-4 py-1', containerClassName)}>
      {label && (
        <span
          className={cn(
            'text-label transition-colors',
            value === 0 ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'border-border bg-muted focus-within:outline-ring flex items-center gap-1 rounded-md border p-0.5 focus-within:outline-2',
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn('hover:bg-background h-6 w-6 rounded-sm p-0', isSm && 'h-5 w-5')}
          aria-label={withLabel(t('decrease'))}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <AppIcon name="Minus" size={isSm ? 10 : 12} />
        </Button>
        <NumberInput
          id={id}
          aria-label={label}
          value={value}
          min={min}
          max={max}
          onValueChange={onChange}
          className={cn(
            'no-spinner h-6 w-10 border-none bg-transparent p-0 text-center font-mono text-sm font-bold tabular-nums shadow-none focus-visible:outline-none',
            isSm && 'h-5 w-8 text-xs',
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn('hover:bg-background h-6 w-6 rounded-sm p-0', isSm && 'h-5 w-5')}
          aria-label={withLabel(t('increase'))}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <AppIcon name="Plus" size={isSm ? 10 : 12} />
        </Button>
      </div>
    </div>
  );
}
