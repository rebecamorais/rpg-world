import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ProfileForm from '@frontend/components/ProfileForm';
import { DeleteAccountCard } from '@frontend/components/profile/DeleteAccountCard';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('settingsTitle') };
}

export default async function ProfilePage() {
  const t = await getTranslations('dashboard');
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();
  // Only the page knows: the profile the layout seeds in the client cache doesn't carry it. If the
  // check fails, only the danger card goes (null), not the whole settings page.
  let hasPassword: boolean | null = false;
  if (user) {
    try {
      hasPassword = await authApi.hasPassword(user.id);
    } catch (error) {
      hasPassword = null;
      console.error('Failed to check whether the account has a password:', error);
    }
  }

  return (
    <PageContainer title={t('settingsTitle')} description={t('settingsSubtitle')}>
      <div className="flex flex-col gap-6">
        <ProfileForm />
        {hasPassword !== null && <DeleteAccountCard hasPassword={hasPassword} />}
      </div>
    </PageContainer>
  );
}
