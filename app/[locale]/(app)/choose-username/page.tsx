import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { localizedHref } from '@/i18n/routing';
import { getLocale, getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ChooseUsernameForm from '@frontend/components/ChooseUsernameForm';
import AuthLayout from '@frontend/components/auth/AuthLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('chooseUsername');
  return { title: t('title') };
}

/** Before the app is used: whoever hasn't picked a username yet (see the dashboard layout). */
export default async function ChooseUsernamePage() {
  const { authApi, profileApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) redirect(localizedHref('/login', await getLocale()));

  const profile = await profileApi.getProfile(user.id);
  if (profile?.usernameChosen) redirect('/characters');

  const t = await getTranslations('chooseUsername');

  return (
    <AuthLayout className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChooseUsernameForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
