'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/** Shown while the party's live channel is down: the screen catches up once it's back. */
export function CombatConnection({ live }: { live: boolean }) {
  const t = useTranslations('combat');

  // The live region stays mounted (screen readers only announce text added to an existing one);
  // sr-only while connected so the empty box takes no room in the layout
  return (
    <p
      role="status"
      className={cn(
        live ? 'sr-only' : 'text-caption text-muted-foreground flex items-center gap-2',
      )}
    >
      {!live && (
        <>
          <AppIcon name="Hourglass" size={14} aria-hidden="true" />
          {t('reconnecting')}
        </>
      )}
    </p>
  );
}
