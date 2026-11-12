import type { ReactNode } from 'react';

import { PartyFrame } from '@frontend/components/party/PartyFrame';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { partyQueryKey } from '@frontend/lib/query-keys';

import { loadParty } from '../load-party';

/** The party's tabs (Table, Combat, Journal, Chest) share its name, its menu and the tab bar. */
export default async function PartyTabsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const party = await loadParty(partyId);

  return (
    <SeededQuery queryKey={partyQueryKey(partyId)} data={party}>
      <PartyFrame partyId={partyId}>{children}</PartyFrame>
    </SeededQuery>
  );
}
