'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

interface HintProps {
  /** What is being explained, shown in bold and in the button's name ("What is …?"). */
  label: string;
  hint: React.ReactNode;
  /** What the button shows: an icon, an abbreviation… */
  children: React.ReactNode;
  className?: string;
}

/**
 * A small button that explains `label`, on hover or on tap: touch screens have no hover, which
 * is all a plain tooltip opens with.
 */
export function Hint({ label, hint, children, className }: HintProps) {
  const t = useTranslations('common');
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t('whatIs', { label })}
          // Radix closes a tooltip when its trigger is pressed or clicked; here a tap is how it opens
          onPointerDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className={cn('focus-ring touch-target cursor-help rounded-md', className)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-foreground font-semibold">{label}</p>
        <div className="text-muted-foreground">{hint}</div>
      </TooltipContent>
    </Tooltip>
  );
}
