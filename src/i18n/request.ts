import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import en from '../../messages/en.json';
import { withFallback } from './messages';
import { routing } from './routing';

// The locale is the one the proxy picked (the [locale] segment), never read from a cookie here:
// that would make every page dynamic. No component formats dates with next-intl, so the time zone
// is fixed.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: 'UTC',
    // What a language doesn't have yet (or has empty) shows in English
    messages:
      locale === routing.defaultLocale
        ? en
        : withFallback((await import(`../../messages/${locale}.json`)).default, en),
  };
});
