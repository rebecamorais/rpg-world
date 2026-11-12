import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { PartyCombatTab } from '@frontend/components/party/PartyPage';

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
  return party ? { title: `${party.name} · ${t('combat')}` } : {};
}

export default async function PartyCombatRoute({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  return <PartyCombatTab partyId={partyId} />;
}
