import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { PartyJournalPage } from '@frontend/components/party/PartyJournalPage';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { partyQueryKey } from '@frontend/lib/query-keys';

import { loadParty } from '../load-party';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  const [t, party] = await Promise.all([
    getTranslations('parties.journal'),
    loadParty((await params).partyId),
  ]);
  return party ? { title: `${party.name} · ${t('tab')}` } : {};
}

export default async function PartyJournalRoute({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const party = await loadParty(partyId);

  return (
    <SeededQuery queryKey={partyQueryKey(partyId)} data={party}>
      <PartyJournalPage partyId={partyId} />
    </SeededQuery>
  );
}
