import type { Metadata } from 'next';

import { localizedHref, routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

import { SITE_URL } from '@frontend/constants/site';

/** The hreflang of each interface language: the Portuguese is Brazil's. */
const HREFLANG: Record<string, string> = { en: 'en', pt: 'pt-BR' };
const OG_LOCALE: Record<string, string> = { en: 'en_US', pt: 'pt_BR' };
const OG_IMAGE = '/og-image.jpg';

/** `path` on the production site, for the sitemap and structured data (the home without a slash). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === '/' ? '' : path}`;
}

/**
 * Each language's address of a localized public page (see LOCALIZED_PATHS), keyed by hreflang.
 * `x-default` is the plain path: it opens in the visitor's language.
 */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [HREFLANG[locale], localizedHref(path, locale)]),
    ),
    'x-default': path,
  };
}

type PublicPage = {
  locale: string;
  /** The page's plain path (`/features`); the Portuguese address is derived from it. */
  path: string;
  /** Left out on the home page, which keeps the site's title. */
  title?: string;
  /** Left out: the site's description. */
  description?: string;
};

/**
 * Metadata of a public page: title, description, canonical and hreflang, plus the whole
 * openGraph and twitter objects. A page's openGraph replaces the layout's instead of merging
 * with it, so it's always built here in full.
 */
export async function publicPageMetadata({
  locale,
  path,
  title,
  description,
}: PublicPage): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo' });
  const pageDescription = description ?? t('description');
  // The <title> gets " · RPG World" from the layout's template; the shared card needs it too
  const shareTitle = title ? `${title} · RPG World` : t('title');
  const url = localizedHref(path, locale);

  return {
    ...(title !== undefined && { title }),
    description: pageDescription,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      siteName: 'RPG World',
      locale: OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale],
      url,
      title: shareTitle,
      description: pageDescription,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: pageDescription,
      images: [OG_IMAGE],
    },
  };
}
