/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Suspense } from 'react';

import { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import ContactCard, { SupportContactCard } from '@frontend/components/feedback/ContactCard';
import { richLinks } from '@frontend/components/shared/rich-links';
import { DISCORD_INVITE } from '@frontend/constants/site';
import { publicPageMetadata } from '@frontend/lib/public-metadata';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'feedback' });
  return publicPageMetadata({
    locale,
    path: '/support',
    title: t('title'),
    description: t('subtitle'),
  });
}

export default async function SupportPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('feedback');

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-200px)] flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Suspense fallback={<ContactCard />}>
          <SupportContactCard />
        </Suspense>
        {/* Beside the form, not instead of it: the community server is also support */}
        <p className="text-body text-muted-foreground text-center">
          {t.rich('discord', richLinks({ discord: DISCORD_INVITE }))}
        </p>
      </div>
    </div>
  );
}
