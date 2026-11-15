import * as React from 'react';

import { Hint } from '@frontend/components/ui/hint';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface StatBlockProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Game icon name (game-icons.net), or a system icon with `iconVariant="system"`. */
  icon: string;
  iconVariant?: 'system' | 'game';
  /** The number's name: it opens from the icon (hover, or tap on a touch screen). */
  label: string;
  /** What the number means, shown under the name. */
  hint?: string;
  /** Shown after the value, e.g. "m" for speed. */
  unit?: string;
  /** The value, usually an editable control (GhostInput, Select). */
  children: React.ReactNode;
}

/**
 * A single combat number on the sheet: armor class, initiative, speed, hit dice. Only the icon and
 * the value show, so five fit side by side even on a phone; the name (and `hint`) opens from the
 * icon, on hover or on tap. Screen readers get the name before the value.
 */
function StatBlock({
  icon,
  iconVariant = 'game',
  label,
  hint,
  unit,
  children,
  className,
  ...props
}: StatBlockProps) {
  return (
    // Measured on the block itself: a narrow one (three across a 320px phone) stacks the icon over
    // the value, so the value keeps the whole width; a wider one puts them side by side
    <div
      className={cn(
        'border-input bg-muted hover:border-character-muted @container min-w-0 rounded-xl border transition-colors',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-1 px-2 py-2 @[6.5rem]:flex-row @[6.5rem]:gap-2 @[6.5rem]:px-3">
        <Hint label={label} hint={hint} className="shrink-0">
          <AppIcon
            name={icon}
            variant={iconVariant}
            size="lg"
            className="text-character-flare"
            aria-hidden="true"
          />
        </Hint>
        <div className="text-foreground flex min-w-0 items-baseline gap-0.5 font-mono text-xl font-bold tabular-nums">
          <span className="sr-only">{label}: </span>
          {children}
          {unit && <span className="text-caption text-muted-foreground font-sans">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export { StatBlock };
