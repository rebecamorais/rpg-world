import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import ProfileForm from '@frontend/components/ProfileForm';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('settingsTitle') };
}

export default async function ProfilePage() {
  const t = await getTranslations('dashboard');

  return (
    <PageContainer title={t('settingsTitle')} description={t('settingsSubtitle')}>
      <ProfileForm />
    </PageContainer>
  );
}
