import type { MetadataRoute } from 'next';

import { localizedHref, routing } from '@/i18n/routing';

import { absoluteUrl, languageAlternates } from '@frontend/lib/public-metadata';

type Page = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'> & { path: string };

const PAGES: Page[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/features', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

/**
 * Each public page once per language, each entry naming all its languages (hreflang), as search
 * engines ask for.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // No lastModified: a build-time date would claim every page changed on every deploy
  return PAGES.flatMap(({ path, ...page }) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, absoluteUrl(href)]),
    );
    return routing.locales.map((locale) => ({
      url: absoluteUrl(localizedHref(path, locale)),
      ...page,
      alternates: { languages },
    }));
  });
}
