import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { PartyChest } from '@frontend/components/party/PartyChestPage';

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
  return party ? { title: `${party.name} · ${t('chest')}` } : {};
}

export default async function PartyChestRoute({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  return <PartyChest partyId={partyId} />;
}
