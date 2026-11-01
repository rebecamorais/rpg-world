import type { Metadata } from 'next';

import { PartyPage } from '@frontend/components/party/PartyPage';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { partyQueryKey } from '@frontend/lib/query-keys';

import { loadParty } from './load-party';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  const party = await loadParty((await params).partyId);
  return party ? { title: party.name } : {};
}

export default async function PartyRoute({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = await params;
  const party = await loadParty(partyId);

  return (
    <SeededQuery queryKey={partyQueryKey(partyId)} data={party}>
      <PartyPage partyId={partyId} />
    </SeededQuery>
  );
}
