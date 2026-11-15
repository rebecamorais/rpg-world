'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

interface HintProps {
  /** What is being explained, shown in bold and in the button's name ("What is …?"). */
  label: string;
  /** The explanation under the name; without it, the tip is just the name. */
  hint?: React.ReactNode;
  /** What the button shows: an icon, an abbreviation… */
  children: React.ReactNode;
  className?: string;
}

/**
 * A small button that explains `label`, on hover or on tap: touch screens have no hover, which
 * is all a plain tooltip opens with. Not a <button>: inside a disabled fieldset (the GM's
 * read-only sheet) a button is disabled too, and an explanation is there to be read, not edited.
 */
export function Hint({ label, hint, children, className }: HintProps) {
  const t = useTranslations('common');
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={t('whatIs', { label })}
          // Radix closes a tooltip when its trigger is pressed or clicked; here a tap is how it opens
          onPointerDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          // inline-block: what a <button> is, so a width or the touch target still apply
          className={cn('focus-ring touch-target inline-block cursor-help rounded-md', className)}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-foreground font-semibold">{label}</p>
        {hint && <div className="text-muted-foreground">{hint}</div>}
      </TooltipContent>
    </Tooltip>
  );
}
