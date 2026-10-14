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
    default: 'border-border bg-muted text-muted-foreground group-hover:text-foreground border',
    accent: 'border-spell-muted bg-spell-surface text-spell-flare border',
    concentration: 'border-warning-muted bg-warning-surface text-warning-flare border',
    ritual: 'border-info-muted bg-info-surface text-info-flare border',
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
          <TooltipContent className="text-xs font-medium">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
