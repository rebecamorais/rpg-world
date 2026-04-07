import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import ResetPasswordForm from '@frontend/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage() {
  const t = await getTranslations('common');

  return (
    <div className="bg-background relative flex flex-1 items-center justify-center p-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('back')}
        </Link>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
