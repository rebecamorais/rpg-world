import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import PartyList from '@frontend/components/party/PartyList';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('parties');
  return { title: t('title') };
}

/** The list comes seeded by the dashboard layout (the sidebar shows it too). */
export default async function PartiesPage() {
  const t = await getTranslations('parties');

  return (
    <PageContainer
      title={t('title')}
      description={t('subtitle')}
      actions={
        <Button asChild variant="outline">
          <Link href="/enemies">
            <AppIcon name="Skull" size={18} aria-hidden="true" />
            {t('enemiesLink')}
          </Link>
        </Button>
      }
    >
      <PartyList />
    </PageContainer>
  );
}
