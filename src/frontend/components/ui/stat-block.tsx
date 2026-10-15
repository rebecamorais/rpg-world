import * as React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface StatBlockProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Game icon name (game-icons.net). */
  icon: string;
  label: string;
  /** Shown after the value, e.g. "m" for speed. */
  unit?: string;
  /** The value, usually an editable control (GhostInput, Select). */
  children: React.ReactNode;
}

/** A single combat number on the sheet: armor class, initiative, speed, hit dice. */
function StatBlock({ icon, label, unit, children, className, ...props }: StatBlockProps) {
  return (
    <div
      className={cn(
        'border-border bg-background/60 hover:border-character-muted flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
        className,
      )}
      {...props}
    >
      <AppIcon
        name={icon}
        variant="game"
        size="lg"
        className="text-character-flare shrink-0"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label text-muted-foreground truncate">{label}</span>
        <div className="text-foreground flex items-baseline gap-1 font-mono text-base font-bold tabular-nums">
          {children}
          {unit && <span className="text-caption text-muted-foreground font-sans">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export { StatBlock };
