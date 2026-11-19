import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import AuthLayout from '@frontend/components/auth/AuthLayout';
import ForgotPasswordForm from '@frontend/components/auth/ForgotPasswordForm';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'forgotPassword' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

/** No way back above the card: the card already leads back to sign in. */
export default async function ForgotPasswordPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);

  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
