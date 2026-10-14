import { getTranslations } from 'next-intl/server';

import ProfileForm from '@frontend/components/ProfileForm';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export default async function ProfilePage() {
  const t = await getTranslations('dashboard');

  return (
    <PageContainer title={t('settingsTitle')} description={t('settingsSubtitle')}>
      <ProfileForm />
    </PageContainer>
  );
}
