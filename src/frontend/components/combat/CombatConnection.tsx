'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';

/** Shown while the party's live channel is down: the screen catches up once it's back. */
export function CombatConnection({ live }: { live: boolean }) {
  const t = useTranslations('combat');
  if (live) return null;

  return (
    <p role="status" className="text-caption text-muted-foreground flex items-center gap-2">
      <AppIcon name="Hourglass" size={14} aria-hidden="true" />
      {t('reconnecting')}
    </p>
  );
}
