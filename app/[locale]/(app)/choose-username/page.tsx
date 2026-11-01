import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ChooseUsernameForm from '@frontend/components/ChooseUsernameForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('chooseUsername');
  return { title: t('title') };
}

/** Before the app is used: whoever hasn't picked a username yet (see the dashboard layout). */
export default async function ChooseUsernamePage() {
  const { authApi, profileApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) redirect('/login');

  const profile = await profileApi.getProfile(user.id);
  if (profile?.usernameChosen) redirect('/characters');

  const t = await getTranslations('chooseUsername');

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="bg-card border-border flex w-full max-w-md flex-col gap-6 rounded-xl border p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-title">{t('title')}</h1>
          <p className="text-muted-foreground text-body">{t('description')}</p>
        </div>
        <ChooseUsernameForm />
      </div>
    </div>
  );
}
