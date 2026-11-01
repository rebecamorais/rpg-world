import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { JoinPartyCard } from '@frontend/components/party/JoinPartyCard';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('parties.join');
  return { title: t('title') };
}

async function loadInvite(code: string) {
  const { partiesApi } = await getApi();
  return partiesApi.getInvite(code).catch(() => null);
}

/** The invite link. Signed out, the dashboard layout sends the person to login and back here. */
export default async function JoinPartyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [t, invite] = await Promise.all([getTranslations('parties.join'), loadInvite(code)]);

  // Already in (or the GM): straight to the party
  if (invite?.myStatus === 'active' || invite?.myStatus === 'gm') {
    redirect(`/parties/${invite.partyId}`);
  }

  return (
    <PageContainer title={t('title')}>
      <JoinPartyCard code={code} invite={invite} />
    </PageContainer>
  );
}
