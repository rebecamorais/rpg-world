import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PartyTableTab } from '@frontend/components/party/PartyPage';

import { loadParty } from '../load-party';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  // "· Table" like the other tabs, so switching tabs is announced
  const [t, party] = await Promise.all([
    getTranslations('parties.tabs'),
    loadParty((await params).partyId),
  ]);
  return party ? { title: `${party.name} · ${t('overview')}` } : {};
}

export default async function PartyTableRoute({
  params,
  searchParams,
}: {
  params: Promise<{ partyId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ partyId }, { mode }] = await Promise.all([params, searchParams]);
  // Links from before the tabs kept the combat in ?mode=combat
  if (mode === 'combat') redirect(`/parties/${partyId}/combat`);

  return <PartyTableTab partyId={partyId} />;
}
