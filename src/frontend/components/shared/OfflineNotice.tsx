'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { useOnline } from '@frontend/hooks/useOnline';
import { cn } from '@frontend/lib/utils';

/**
 * "No connection" pinned to the top of the screen while the browser is offline, shared by the
 * sheet and the party. Changes fail at once offline (nothing waits to be sent), so this says it
 * before the person tries. It stays put while scrolling, unlike the combat's "Reconnecting…".
 */
export function OfflineNotice() {
  const t = useTranslations('common');
  const online = useOnline();

  // The live region stays mounted: screen readers only announce text added to an existing one
  return (
    <p
      role="status"
      className={cn(
        online
          ? 'sr-only'
          : 'border-warning-muted bg-warning-surface text-warning-flare fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto flex w-fit max-w-md items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg',
      )}
    >
      {!online && (
        <>
          <AppIcon name="TriangleAlert" size={16} aria-hidden="true" />
          {t('offline')}
        </>
      )}
    </p>
  );
}
