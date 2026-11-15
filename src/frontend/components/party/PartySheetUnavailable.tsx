'use client';

import { useTranslations } from 'next-intl';

import { EmptyState } from '@frontend/components/ui/empty-state';
import AppLink from '@frontend/demo/AppLink';

/**
 * A sheet opened through a party the person is in, that isn't theirs to read: said plainly
 * instead of "not found". `private`: a fellow player's sheet (only its owner and the GM see it).
 * `missing`: the character isn't at the table (left, deleted, or never there).
 */
export function PartySheetUnavailable({
  partyId,
  reason,
}: {
  partyId: string;
  reason: 'private' | 'missing';
}) {
  const missing = reason === 'missing';
  const t = useTranslations('parties.sheet');

  return (
    <EmptyState
      icon={missing ? 'Shield' : 'EyeOff'}
      title={missing ? t('missingTitle') : t('privateTitle')}
      description={missing ? t('missingDescription') : t('privateDescription')}
      className="w-full max-w-lg"
      action={
        <AppLink href={`/parties/${partyId}`} className="text-primary-flare text-sm underline">
          {t('back')}
        </AppLink>
      }
    />
  );
}
