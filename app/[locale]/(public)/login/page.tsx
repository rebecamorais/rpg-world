import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import AuthLayout from '@frontend/components/auth/AuthLayout';
import LoginForm from '@frontend/components/auth/LoginForm';
import { publicPageMetadata } from '@frontend/lib/public-metadata';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login' });
  // Canonical and hreflang like the other localized public pages
  return publicPageMetadata({
    locale,
    path: '/login',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/** Whoever is already signed in never sees this page: the proxy sends them to /characters. */
export default async function LoginPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('common');

  return (
    <AuthLayout back={{ href: '/', label: t('back') }}>
      <LoginForm />
    </AuthLayout>
  );
}
