import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import {
  AVAILABLE_FEATURES,
  FeatureGrid,
  PLANNED_FEATURES,
} from '@frontend/components/landing/FeatureGrid';
import { FeatureShowcase } from '@frontend/components/landing/FeatureShowcase';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

const GITHUB_REPO = 'https://github.com/rebecamorais/rpg-world';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('features');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/features' },
    // openGraph replaces the layout's whole object, so the image has to be repeated here
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: '/features',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

/** Public page: what the app does, so visitors can see it before creating an account. */
export default async function FeaturesPage() {
  const t = await getTranslations('features');
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return (
    <div className="container mx-auto flex max-w-6xl flex-1 flex-col gap-16 px-4 py-16 sm:px-8 sm:py-20">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="text-label text-primary-flare">{t('eyebrow')}</p>
        <h1 className="text-display">{t('title')}</h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </header>

      <section aria-labelledby="showcase-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="showcase-title" className="text-title">
            {t('showcase.title')}
          </h2>
          <p className="text-muted-foreground">{t('showcase.subtitle')}</p>
        </div>
        <FeatureShowcase />
      </section>

      <section aria-labelledby="available-title" className="flex flex-col gap-6">
        <h2 id="available-title" className="text-title">
          {t('availableTitle')}
        </h2>
        <FeatureGrid features={AVAILABLE_FEATURES} group="items" />
      </section>

      <section aria-labelledby="planned-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="planned-title" className="text-title">
            {t('plannedTitle')}
          </h2>
          <p className="text-muted-foreground">{t('plannedSubtitle')}</p>
        </div>
        <FeatureGrid features={PLANNED_FEATURES} group="planned" />
      </section>

      <section
        aria-labelledby="open-title"
        className="border-border bg-muted/30 flex flex-col gap-4 rounded-xl border p-6 sm:p-8"
      >
        <h2 id="open-title" className="text-title">
          {t('openTitle')}
        </h2>
        <p className="text-muted-foreground max-w-3xl">{t('openDescription')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              {t('openSource')}
              <AppIcon name="ExternalLink" size={14} aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/terms">{t('credits')}</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="cta-title" className="flex flex-col items-center gap-6 text-center">
        <h2 id="cta-title" className="text-title">
          {t('ctaTitle')}
        </h2>
        <Button asChild size="lg" className="px-8">
          {user ? (
            <Link href="/characters">{t('ctaCharacters')}</Link>
          ) : (
            <Link href="/register">{t('ctaStart')}</Link>
          )}
        </Button>
      </section>
    </div>
  );
}
