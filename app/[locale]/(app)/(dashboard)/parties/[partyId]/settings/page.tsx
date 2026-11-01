import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { PartySettings } from '@frontend/components/party/PartySettings';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { partyQueryKey } from '@frontend/lib/query-keys';

import { loadParty } from '../load-party';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  const [t, party] = await Promise.all([
    getTranslations('parties.settings'),
    loadParty((await params).partyId),
  ]);
  return party ? { title: `${party.name} · ${t('eyebrow')}` } : {};
}

export default async function PartySettingsRoute({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const party = await loadParty(partyId);

  return (
    <SeededQuery queryKey={partyQueryKey(partyId)} data={party}>
      <PartySettings partyId={partyId} />
    </SeededQuery>
  );
}
