'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';

import type { PartyRole } from '@backend/contexts/parties/domain/Party';

import { googleDocUrl } from '@shared/google-docs';

/** The party's Google Docs journal: embedded on a computer, a notice on a phone. */
export function PartyJournal({
  docId,
  role,
  partyId,
}: {
  docId: string | null;
  role: PartyRole;
  partyId: string;
}) {
  const t = useTranslations('parties.journal');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!docId) {
    return (
      <EmptyState
        icon="BookOpen"
        title={role === 'gm' ? t('emptyGm') : t('emptyPlayer')}
        action={
          role === 'gm' ? (
            <Link
              href={`/parties/${partyId}/settings`}
              className="text-primary-flare text-sm underline"
            >
              {t('setUp')}
            </Link>
          ) : undefined
        }
      />
    );
  }

  const url = googleDocUrl(docId);

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="outline" className="self-start">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <AppIcon name="ExternalLink" size={18} aria-hidden="true" />
          {t('open')}
        </a>
      </Button>
      {isDesktop === true && (
        <iframe
          src={url}
          title={t('frameTitle')}
          allow="clipboard-read; clipboard-write"
          className="h-[75vh] w-full rounded-md border"
        />
      )}
      {isDesktop === false && <p className="text-muted-foreground">{t('mobileNotice')}</p>}
    </div>
  );
}
