import { cache } from 'react';

import type { Metadata } from 'next';

import { getApi } from '@api';

import { PartyPage } from '@frontend/components/party/PartyPage';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { partyQueryKey } from '@frontend/lib/query-keys';

/** Loaded once per request (title and page). Null when not found or not the person's. */
const loadParty = cache(async (partyId: string) => {
  const { authApi, partiesApi } = await getApi();
  const user = await authApi.getSessionUser();
  return user ? partiesApi.get(partyId, user.id).catch(() => null) : null;
});

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
