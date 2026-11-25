import type { Metadata } from 'next';

import { type LocaleParams, localizedHref } from '@/i18n/routing';
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
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <AuthLayout back={{ href: localizedHref('/', locale), label: t('back') }}>
      <SignUpForm />
    </AuthLayout>
  );
}
