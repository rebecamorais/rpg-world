import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import AuthLayout from '@frontend/components/auth/AuthLayout';
import SignUpForm from '@frontend/components/auth/SignUpForm';
import { publicPageMetadata } from '@frontend/lib/public-metadata';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  // Canonical and hreflang like the other localized public pages
  return publicPageMetadata({
    locale,
    path: '/register',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function RegisterPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('common');

  return (
    <AuthLayout back={{ href: '/', label: t('back') }}>
      <SignUpForm />
    </AuthLayout>
  );
}
