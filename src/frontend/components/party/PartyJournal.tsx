'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyRole } from '@backend/contexts/parties/domain/Party';

import { googleDocUrl } from '@shared/google-docs';

/**
 * The party's Google Docs journal: embedded on a wide screen; on a narrow one, the button to open
 * it in Google Docs is the whole screen's action.
 */
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
    return role === 'gm' ? (
      <EmptyState
        icon="BookOpen"
        title={t('emptyGmTitle')}
        description={t('emptyGm')}
        action={
          <Button asChild>
            {/* Straight to the journal card, far down the settings */}
            <AppLink href={`/parties/${partyId}/settings#journal`}>{t('setUp')}</AppLink>
          </Button>
        }
      />
    ) : (
      <EmptyState icon="BookOpen" title={t('emptyPlayer')} description={t('emptyPlayerHint')} />
    );
  }

  const url = googleDocUrl(docId);
  const open = (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <AppIcon name="ExternalLink" size={18} aria-hidden="true" />
      {t('open')}
    </a>
  );

  if (isDesktop === false) {
    return (
      <div className="flex flex-col gap-3">
        <Button asChild className="w-full">
          {open}
        </Button>
        <p className="text-body text-muted-foreground">{t('narrowNotice')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="outline">
          {open}
        </Button>
        {/* Google's own error page shows inside the frame, white and in English: say what to do */}
        <p className="text-caption text-muted-foreground">
          {t(role === 'gm' ? 'frameHelpGm' : 'frameHelpPlayer')}
        </p>
      </div>
      {isDesktop === true && (
        <iframe
          src={url}
          title={t('frameTitle')}
          allow="clipboard-read; clipboard-write"
          className="h-[75vh] w-full rounded-md border"
        />
      )}
    </div>
  );
}

/** The journal tab: the party's journal for the GM and the players alike. */
export function PartyJournalTab({ partyId }: { partyId: string }) {
  const { party } = useParty(partyId);
  if (!party) return null;
  return <PartyJournal docId={party.journalDocId} role={party.role} partyId={party.id} />;
}
