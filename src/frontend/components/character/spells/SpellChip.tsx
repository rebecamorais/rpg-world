import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

export interface SpellChipProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'ritual' | 'concentration';
  tooltip?: string;
  className?: string;
}

export function SpellChip({
  children,
  icon,
  variant = 'default',
  tooltip,
  className,
}: SpellChipProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium uppercase transition-colors';

  const variants = {
    default:
      'border border-white/10 bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white',
    accent:
      'border border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]/80',
    concentration: 'border border-amber-500/20 bg-amber-500/10 text-amber-500/80',
    ritual: 'border border-sky-500/20 bg-sky-500/10 text-sky-500/80',
  };

  const content = (
    <div
      className={cn(baseStyles, variants[variant], !children && 'aspect-square p-0.5', className)}
    >
      {icon && <span className={cn('opacity-70', !!children && 'mr-0')}>{icon}</span>}
      {children}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent className="border-white/10 bg-black/90 text-xs font-medium text-white">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
