/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { AVAILABLE_FEATURES, FeatureGrid } from '@frontend/components/landing/FeatureGrid';
import HeroCTA from '@frontend/components/layout/HeroCTA';
import { SheetPreview } from '@frontend/components/layout/SheetPreview';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

// The four features the home page shows before "see all"
const HIGHLIGHTS = AVAILABLE_FEATURES.filter(({ key }) =>
  ['calculations', 'spellbook', 'lore', 'languages'].includes(key),
);

// Structured data so search engines and AI assistants know what the app is
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'RPG World',
  url: 'https://rpgworldapp.com',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  description:
    'Free, open-source app to create and manage D&D 5e character sheets, in English and Brazilian Portuguese.',
  inLanguage: ['en', 'pt-BR'],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  license: 'https://www.gnu.org/licenses/gpl-3.0.html',
  codeRepository: 'https://github.com/rebecamorais/rpg-world',
  author: { '@type': 'Person', name: 'Rebeca Morais' },
};

export default async function Home() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();
  const t = await getTranslations('features');

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        // Static object defined above; escape '<' so it can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center transition-all duration-700 md:p-16">
        <HeroCTA isAuthenticated={!!user} />
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
          <Link href="/features">
            {t('seeAll')}
            <AppIcon name="ChevronRight" size={16} aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
