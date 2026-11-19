/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Suspense } from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import { type LocaleParams, localizedHref } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AccountDeletedNotice } from '@frontend/components/landing/AccountDeletedNotice';
import { AVAILABLE_FEATURES, FeatureGrid } from '@frontend/components/landing/FeatureGrid';
import HeroCTA from '@frontend/components/layout/HeroCTA';
import { SheetPreview } from '@frontend/components/layout/SheetPreview';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { GITHUB_REPO, SITE_URL } from '@frontend/constants/site';
import { absoluteUrl, publicPageMetadata } from '@frontend/lib/public-metadata';

// The four features the home page shows before "see all"
const HIGHLIGHTS = AVAILABLE_FEATURES.filter(({ key }) =>
  ['calculations', 'spellbook', 'parties', 'inventory'].includes(key),
);

/** The site's title and description, with the canonical and hreflang of the home. */
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return publicPageMetadata({ locale: (await params).locale, path: '/' });
}

// Structured data so search engines and AI assistants know what the app is, in the page's language
function structuredData(locale: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RPG World',
    url: absoluteUrl(localizedHref('/', locale)),
    logo: `${SITE_URL}/logo/rpg-world.png`,
    image: `${SITE_URL}/og-image.jpg`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    description,
    inLanguage: ['en', 'pt-BR'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://www.gnu.org/licenses/gpl-3.0.html',
    codeRepository: GITHUB_REPO,
    author: { '@type': 'Person', name: 'Rebeca Morais' },
  };
}

export default async function Home({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('features');
  const tSeo = await getTranslations('seo');

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        // Built from our own messages; escape '<' so it can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData(locale, tSeo('description'))).replace(
            /</g,
            '\\u003c',
          ),
        }}
      />
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center md:p-16">
        <Suspense>
          <AccountDeletedNotice />
        </Suspense>
        <HeroCTA />
        <SheetPreview />
      </div>

      <section
        aria-labelledby="highlights-title"
        className="container mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pb-20 text-center sm:px-8"
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="highlights-title" className="text-title text-foreground">
            {t('highlightsTitle')}
          </h2>
          <p className="text-muted-foreground">{t('highlightsSubtitle')}</p>
        </div>
        <FeatureGrid features={HIGHLIGHTS} group="items" className="w-full" />
        <Button asChild variant="outline" size="lg">
          <Link href={localizedHref('/features', locale)}>
            {t('seeAll')}
            <AppIcon name="ChevronRight" size={16} aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
