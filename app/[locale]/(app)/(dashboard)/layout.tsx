import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getApi } from '@api';

import DashboardShell, { loadDashboardShell } from '@frontend/components/layout/DashboardShell';
import { MainContent } from '@frontend/components/layout/PageFrame';

import { PATHNAME_HEADER } from '@shared/http/pathname-header';

const INVITE_PATH = '/parties/join/';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  // The page that was asked for (a sheet, an invite), to come back to after login or onboarding
  const asked = (await headers()).get(PATHNAME_HEADER);
  const back = asked && asked !== '/characters' ? `?next=${encodeURIComponent(asked)}` : '';

  if (!user) {
    // The invite link opens signed out too: its page shows the party's name and picture (also
    // the link preview on Discord and WhatsApp) and a way to sign in and come back
    if (asked?.startsWith(INVITE_PATH)) {
      return (
        <MainContent className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10">
          {children}
        </MainContent>
      );
    }
    redirect(`/login${back}`);
  }

  // The layout stays mounted while navigating the dashboard, so this only runs on a full page load
  const shell = await loadDashboardShell(user);

  // A generated username is a placeholder nobody sees: the person picks one before using the app
  if (shell.profile && !shell.profile.usernameChosen) {
    redirect(`/choose-username${back}`);
  }

  return <DashboardShell {...shell}>{children}</DashboardShell>;
}
