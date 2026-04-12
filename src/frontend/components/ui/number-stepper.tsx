'use client';

import * as React from 'react';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { cn } from '@frontend/lib/utils';

export interface NumberStepperProps {
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

  return (
    <div className={cn('flex items-center justify-between gap-4 py-1', containerClassName)}>
      {label && (
        <span
          className={cn(
            'text-sm font-bold uppercase transition-opacity',
            value === 0 ? 'opacity-40' : 'opacity-80',
          )}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-0.5 focus-within:ring-1 focus-within:ring-zinc-700',
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 rounded-sm p-0 transition-colors hover:bg-zinc-800',
            isSm && 'h-5 w-5',
          )}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <AppIcon name="Minus" size={isSm ? 10 : 12} />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            onChange(Math.min(max, Math.max(min, val)));
          }}
          className={cn(
            'no-spinner h-6 w-10 border-none bg-transparent p-0 text-center text-sm font-bold shadow-none focus-visible:ring-0',
            isSm && 'h-5 w-8 text-xs',
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 rounded-sm p-0 transition-colors hover:bg-zinc-800',
            isSm && 'h-5 w-5',
          )}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <AppIcon name="Plus" size={isSm ? 10 : 12} />
        </Button>
      </div>
    </div>
  );
}
