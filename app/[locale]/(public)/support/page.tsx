/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import ContactCard from '@frontend/components/feedback/ContactCard';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'feedback' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function SupportPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-200px)] flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <ContactCard />
      </div>
    </div>
  );
}
