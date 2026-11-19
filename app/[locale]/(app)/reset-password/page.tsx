import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import AuthLayout from '@frontend/components/auth/AuthLayout';
import ResetPasswordForm from '@frontend/components/auth/ResetPasswordForm';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { maskEmail } from '@frontend/lib/mask-email';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('resetPassword');
  return { title: t('title') };
}

/**
 * Target of the recovery e-mail: /api/auth/confirm starts the session from the link and sends it
 * here. Without a session (opened directly, or the link expired) there is nothing to change, so
 * the page says so at once and offers a new link, instead of a form that can only fail.
 */
export default async function ResetPasswordPage() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    const t = await getTranslations();
    return (
      <AuthLayout>
        <EmptyState
          titleAs="h1"
          title={t('common.errors.expired_link_title')}
          description={t('common.errors.auth_error_link_expired')}
          action={
            <Button asChild>
              <Link href="/forgot-password">{t('auth.requestNewLink')}</Link>
            </Button>
          }
          className="bg-card/80"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Says whose password changes: the link may belong to another account than the one that was signed in */}
      <ResetPasswordForm email={user.email ? maskEmail(user.email) : undefined} />
    </AuthLayout>
  );
}
