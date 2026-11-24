import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import DashboardShell, { loadDashboardShell } from '@frontend/components/layout/DashboardShell';
import StandaloneMain from '@frontend/components/layout/StandaloneMain';
import { NotFoundState } from '@frontend/components/shared/NotFoundState';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return { title: t('title') };
}

/**
 * The 404 of a URL no page matches ([...rest]) and of `notFound()` in an (app) page, between the
 * site's header and footer. Signed in, it also keeps the sidebar, as on any page of the app.
 * (Under the dashboard, (dashboard)/not-found.tsx answers first, inside the sidebar that's there.)
 */
export default async function NotFound() {
  // A failed check is a signed-out visitor: the 404 must still render
  const user = await getApi()
    .then(({ authApi }) => authApi.getSessionUser())
    .catch(() => null);

  if (!user) {
    return (
      <StandaloneMain>
        <NotFoundState signedIn={false} />
      </StandaloneMain>
    );
  }

  return (
    <DashboardShell {...await loadDashboardShell(user)}>
      <NotFoundState signedIn />
    </DashboardShell>
  );
}
