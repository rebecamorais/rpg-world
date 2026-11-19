import { defineRouting } from 'next-intl/routing';

/**
 * The language comes from the NEXT_LOCALE cookie (the language switcher), else from the browser
 * (Accept-Language). The proxy rewrites each page to /<locale>/... internally, so the URL never
 * shows it and the public pages can be prebuilt once per language. The exception are the
 * LOCALIZED_PATHS below, which have one address per language.
 */
export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'never',
  // Same lifetime the language switcher gives it
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

/**
 * Public pages search engines index in each language: English at the plain path, the others
 * prefixed (/pt/features), with hreflang between them. The signed-in app keeps a single address
 * per page, and its language stays the cookie's.
 */
export const LOCALIZED_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/features',
  '/support',
  '/privacy',
  '/terms',
  '/login',
  '/register',
]);

const LOCALE_SEGMENT = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`);

/** `pathname` without a leading language segment: `/pt/features` → `/features`, `/pt` → `/`. */
export function withoutLocale(pathname: string): string {
  return pathname.replace(LOCALE_SEGMENT, '') || '/';
}

/**
 * The address of `href` in `locale`: a localized public page outside the default language gets
 * the prefix (`/register` → `/pt/register`); anything else stays as is.
 */
export function localizedHref(href: string, locale: string): string {
  const split = href.search(/[?#]/);
  const path = split === -1 ? href : href.slice(0, split);
  const rest = split === -1 ? '' : href.slice(split);
  if (locale === routing.defaultLocale || !LOCALIZED_PATHS.has(path)) return href;
  return `/${locale}${path === '/' ? '' : path}${rest}`;
}

/** Props of the pages and layouts under app/[locale]. */
export type LocaleParams = { params: Promise<{ locale: string }> };
