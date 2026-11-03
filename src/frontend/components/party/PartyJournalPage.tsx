'use client';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { useParty } from '@frontend/hooks/useParty';

import { PartyJournal } from './PartyJournal';
import { PartyNotFound } from './PartyPage';

/** The party's journal, on its own page (the sidebar opens it), for the GM and the players. */
export function PartyJournalPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.journal');
  const { party, isLoading } = useParty(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer title={party.name} eyebrow={t('title')}>
      <PartyJournal docId={party.journalDocId} role={party.role} partyId={party.id} />
    </PageContainer>
  );
}
