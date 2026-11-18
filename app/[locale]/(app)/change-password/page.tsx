import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

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
  if (!user) redirect(`/login?next=${encodeURIComponent('/change-password')}`);

  // If the check fails, the current password is asked anyway: the server decides, and an account
  // without one is not refused for sending it
  const hasPassword = await authApi.hasPassword(user.id).catch((error: unknown) => {
    console.error('Failed to check whether the account has a password:', error);
    return true;
  });

  return <ChangePasswordForm hasPassword={hasPassword} />;
}
