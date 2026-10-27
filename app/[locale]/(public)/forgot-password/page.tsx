import Link from 'next/link';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import ForgotPasswordForm from '@frontend/components/auth/ForgotPasswordForm';

export default async function ForgotPasswordPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
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
      <ForgotPasswordForm />
    </div>
  );
}
