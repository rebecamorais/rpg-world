import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { localizedHref } from '@/i18n/routing';
import { getLocale, getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ChangePasswordForm from '@frontend/components/auth/ChangePasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('changePassword');
  return { title: t('title') };
}

/** Signed in only: the (app) layout doesn't protect it, so the page does, like choose-username. */
export default async function ChangePasswordPage() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) {
    redirect(
      localizedHref(`/login?next=${encodeURIComponent('/change-password')}`, await getLocale()),
    );
  }

  // An account without a password creates one through the e-mail link, not with a session alone.
  // If the check fails, the form shows: the server checks again
  const hasPassword = await authApi.hasPassword(user.id).catch((error: unknown) => {
    console.error('Failed to check whether the account has a password:', error);
    return true;
  });
  if (!hasPassword) redirect('/forgot-password');

  return <ChangePasswordForm hasPassword />;
}
