import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import PartyList from '@frontend/components/party/PartyList';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('parties');
  return { title: t('title') };
}

/** The list comes seeded by the dashboard layout (the sidebar shows it too). */
export default async function PartiesPage() {
  const t = await getTranslations('parties');

  return (
    <PageContainer title={t('title')} description={t('subtitle')}>
      <PartyList />
    </PageContainer>
  );
}
