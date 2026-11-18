import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ProfileForm from '@frontend/components/ProfileForm';
import { AccountCard } from '@frontend/components/profile/AccountCard';
import { DeleteAccountCard } from '@frontend/components/profile/DeleteAccountCard';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('myProfile') };
}

/** "My profile": the Profile, Account and Danger zone cards. */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string | string[] }>;
}) {
  const t = await getTranslations('dashboard');
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();
  // Only the page knows: the profile the layout seeds in the client cache doesn't carry it. If the
  // check fails, only the danger card goes (null), not the whole page.
  let hasPassword: boolean | null = false;
  if (user) {
    try {
      hasPassword = await authApi.hasPassword(user.id);
    } catch (error) {
      hasPassword = null;
      console.error('Failed to check whether the account has a password:', error);
    }
  }
  // The password page reloads here after the change, so its confirmation survives the reload
  const passwordChanged = (await searchParams).passwordChanged !== undefined;

  return (
    <PageContainer title={t('myProfile')} description={t('settingsSubtitle')}>
      <div className="flex flex-col gap-6">
        <ProfileForm />
        {user?.email && (
          // Unknown (null): the password page itself knows, so it stays reachable
          <AccountCard
            email={user.email}
            hasPassword={hasPassword !== false}
            passwordChanged={passwordChanged}
          />
        )}
        {hasPassword !== null && <DeleteAccountCard hasPassword={hasPassword} />}
      </div>
    </PageContainer>
  );
}
