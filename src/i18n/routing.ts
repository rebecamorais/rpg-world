import { defineRouting } from 'next-intl/routing';

/**
 * The language comes from the NEXT_LOCALE cookie (the language switcher), else from the browser
 * (Accept-Language). The proxy rewrites each page to /<locale>/... internally, so the URL never
 * shows it and the public pages can be prebuilt once per language.
 */
export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'never',
  // Same lifetime the language switcher gives it
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

/** Props of the pages and layouts under app/[locale]. */
export type LocaleParams = { params: Promise<{ locale: string }> };
