import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getApi } from '@api';

import Sidebar from '@frontend/components/layout/Sidebar';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { SIDEBAR_PINNED_COOKIE } from '@frontend/constants/sidebar';
import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY, PROFILE_QUERY_KEY } from '@frontend/lib/query-keys';

import { PATHNAME_HEADER } from '@shared/http/pathname-header';

const INVITE_PATH = '/parties/join/';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authApi, profileApi, partiesApi } = await getApi();
  const user = await authApi.getSessionUser();

  // The page that was asked for (a sheet, an invite), to come back to after login or onboarding
  const asked = (await headers()).get(PATHNAME_HEADER);
  const back = asked && asked !== '/characters' ? `?next=${encodeURIComponent(asked)}` : '';

  if (!user) {
    // The invite link opens signed out too: its page shows the party's name and picture (also
    // the link preview on Discord and WhatsApp) and a way to sign in and come back
    if (asked?.startsWith(INVITE_PATH)) {
      return <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10">{children}</div>;
    }
    redirect(`/login${back}`);
  }

  // The sidebar shows the username and avatar from the first paint, instead of a placeholder
  // swapped after /api/profile. The layout stays mounted while navigating the dashboard, so this
  // only runs on a full page load. If it fails, the sidebar fetches it as before.
  const sidebarPinned = (await cookies()).get(SIDEBAR_PINNED_COOKIE)?.value !== 'false';
  const [profile, parties] = await Promise.all([
    profileApi.getProfile(user.id).catch(() => null),
    partiesApi.listMine().catch(() => null),
  ]);

  // A generated username is a placeholder nobody sees: the person picks one before using the app
  if (profile && !profile.usernameChosen) {
    redirect(`/choose-username${back}`);
  }

  return (
    <SeededQuery queryKey={PROFILE_QUERY_KEY} data={profile}>
      <SeededQuery queryKey={PARTIES_QUERY_KEY} data={parties}>
        <UserProvider user={user}>
          <div
            data-dashboard
            className="group/dashboard bg-sidebar text-foreground flex min-h-[calc(100vh-var(--header-height))]"
          >
            {/* Sidebar */}
            <Sidebar initialPinned={sidebarPinned} />

            {/* Content area (the main landmark is in the root layout) */}
            {/* Positioned: a sheet's background art fills this whole area (SheetBackdrop) */}
            <div className="relative min-w-0 flex-1">
              {/* Same width, side and top spacing on every dashboard page; collapsing the menu
                  only gives the page more room if its limit grows too */}
              <div className="mx-auto w-full max-w-5xl px-4 py-6 group-has-[[data-sidebar=rail]]/dashboard:max-w-7xl sm:px-6 md:py-10">
                {children}
              </div>
            </div>
          </div>
        </UserProvider>
      </SeededQuery>
    </SeededQuery>
  );
}
