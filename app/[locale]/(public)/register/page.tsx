import Link from 'next/link';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import SignUpForm from '@frontend/components/auth/SignUpForm';

export default async function RegisterPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('common');

  return (
    <div className="bg-background relative flex flex-1 items-center justify-center p-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('back')}
        </Link>
      </div>
      <SignUpForm />
    </div>
  );
}
