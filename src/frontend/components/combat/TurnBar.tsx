import type { ReactNode } from 'react';

import { cn } from '@frontend/lib/utils';

/**
 * The combat's turn controls, always in reach: on a phone, fixed right above the party's tab bar
 * (in reach of the thumb, however far the list scrolls); on larger screens, stuck to the bottom
 * of the list. Toasts move up while it shows (see `--turn-bar` in globals.css).
 */
export function TurnBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-turn-bar
      className={cn(
        'border-border bg-card/95 z-30 flex items-center gap-3 border-t px-4 py-3 backdrop-blur-md',
        'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
        'md:sticky md:bottom-4 md:rounded-xl md:border md:shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}
