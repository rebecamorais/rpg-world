import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'pt'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale)) {
    locale = locales[0];
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
