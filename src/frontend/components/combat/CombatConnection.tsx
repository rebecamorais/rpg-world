'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { useOnline } from '@frontend/hooks/useOnline';
import { cn } from '@frontend/lib/utils';

/**
 * Shown while the party's live channel is down: the screen catches up once it's back. Offline it
 * says so instead, since nothing is sent either (changes fail at once, see QueryProvider).
 */
export function CombatConnection({ live }: { live: boolean }) {
  const t = useTranslations('combat');
  const online = useOnline();

  // The live region stays mounted (screen readers only announce text added to an existing one);
  // sr-only while connected so the empty box takes no room in the layout
  return (
    <p
      role="status"
      className={cn(
        live
          ? 'sr-only'
          : online
            ? 'text-caption text-muted-foreground flex items-center gap-2'
            : 'text-caption text-warning-flare flex items-center gap-2',
      )}
    >
      {!live && (
        <>
          <AppIcon name={online ? 'Hourglass' : 'TriangleAlert'} size={14} aria-hidden="true" />
          {online ? t('reconnecting') : t('offline')}
        </>
      )}
    </p>
  );
}
