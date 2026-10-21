'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

interface StatBlockProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Game icon name (game-icons.net), or a system icon with `iconVariant="system"`. */
  icon: string;
  iconVariant?: 'system' | 'game';
  label: string;
  /**
   * What the number means. When set, only the icon and the value are shown: the label and this
   * text open from the icon, on hover or on tap (touch screens have no hover).
   */
  hint?: string;
  /** Shown after the value, e.g. "m" for speed. */
  unit?: string;
  /** The value, usually an editable control (GhostInput, Select). */
  children: React.ReactNode;
}

type IconProps = { icon: string; iconVariant?: 'system' | 'game' };

function StatIcon({ icon, iconVariant = 'game' }: IconProps) {
  return (
    <AppIcon
      name={icon}
      variant={iconVariant}
      size="lg"
      className="text-character-flare shrink-0"
      aria-hidden="true"
    />
  );
}

function StatHint({ icon, iconVariant, label, hint }: IconProps & { label: string; hint: string }) {
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
          className="focus-ring touch-target cursor-help rounded-md"
        >
          <StatIcon icon={icon} iconVariant={iconVariant} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-foreground font-semibold">{label}</p>
        <p className="text-muted-foreground">{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** A single combat number on the sheet: armor class, initiative, speed, hit dice. */
function StatBlock({
  icon,
  iconVariant,
  label,
  hint,
  unit,
  children,
  className,
  ...props
}: StatBlockProps) {
  return (
    <div
      className={cn(
        'border-border bg-background/60 hover:border-character-muted flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
        className,
      )}
      {...props}
    >
      {hint ? (
        <StatHint icon={icon} iconVariant={iconVariant} label={label} hint={hint} />
      ) : (
        <StatIcon icon={icon} iconVariant={iconVariant} />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        {!hint && <span className="text-label text-muted-foreground truncate">{label}</span>}
        <div className="text-foreground flex items-baseline gap-0.5 font-mono text-xl font-bold tabular-nums">
          {children}
          {unit && <span className="text-caption text-muted-foreground font-sans">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export { StatBlock };
