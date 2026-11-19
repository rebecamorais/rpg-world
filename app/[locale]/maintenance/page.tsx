/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { richLinks } from '@frontend/components/shared/rich-links';
import { AppIcon } from '@frontend/components/ui/icon';
import { DISCORD_INVITE } from '@frontend/constants/site';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'maintenance' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

/**
 * The screen every page shows while the maintenance flag is on (proxy.ts rewrites to it, at the
 * URL that was asked for). Prebuilt and without the site's header: nothing here reads the
 * database or the session, which are what's down.
 */
export default async function MaintenancePage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('maintenance');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <AppIcon name="dice-fire" variant="game" size={56} className="text-primary-flare" />
      <h1 className="text-title">{t('title')}</h1>
      <p className="text-muted-foreground max-w-md">{t('description')}</p>
      <p className="text-muted-foreground max-w-md">
        {t.rich('discord', richLinks({ discord: DISCORD_INVITE }))}
      </p>
    </main>
  );
}
