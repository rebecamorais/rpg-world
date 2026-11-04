import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getApi } from '@api';

import { ConfirmAccountDeletion } from '@frontend/components/profile/ConfirmAccountDeletion';

// The link carries the token in its query: keep the page out of search results, and keep the
// address (with the token) from reaching any other site through the Referer header
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: 'accountDeletion' });
  return {
    title: t('confirm.metaTitle'),
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

/**
 * Opened from the e-mailed link, signed in or not. Reading the token makes this page dynamic, which
 * the other public pages are not. Opening only looks the link up; the account goes with the button.
 */
export default async function DeleteAccountPage({
  params,
  searchParams,
}: LocaleParams & { searchParams: Promise<{ token?: string | string[] }> }) {
  setRequestLocale((await params).locale);
  const { token } = await searchParams;
  const value = typeof token === 'string' ? token : '';

  const { authApi } = await getApi();
  const account = value ? await authApi.getAccountDeletion(value) : null;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <ConfirmAccountDeletion account={account} token={value} />
    </div>
  );
}
