import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { PartyJournalTab } from '@frontend/components/party/PartyJournal';

import { loadParty } from '../../load-party';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  const [t, party] = await Promise.all([
    getTranslations('parties.tabs'),
    loadParty((await params).partyId),
  ]);
  return party ? { title: `${party.name} · ${t('journal')}` } : {};
}

export default async function PartyJournalRoute({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  return <PartyJournalTab partyId={partyId} />;
}
