import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { NotFoundState } from '@frontend/components/shared/NotFoundState';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return { title: t('title') };
}

/**
 * `notFound()` in a dashboard page: the 404 inside the dashboard layout, sidebar and all. Signed
 * out, the layout only lets the invite page through; its way back is the home page.
 */
export default async function DashboardNotFound() {
  const user = await getApi()
    .then(({ authApi }) => authApi.getSessionUser())
    .catch(() => null);
  return <NotFoundState signedIn={Boolean(user)} />;
}
