import { cookies } from 'next/headers';

import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'pt'];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : locales[0];

  const timeZone = cookieStore.get('NEXT_TIMEZONE')?.value || 'UTC';

  return {
    locale,
    timeZone,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
