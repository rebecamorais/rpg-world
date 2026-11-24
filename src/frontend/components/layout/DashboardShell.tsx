import type { ReactNode } from 'react';

import { cookies } from 'next/headers';

import { getApi } from '@api';

import { MainContent } from '@frontend/components/layout/PageFrame';
import Sidebar from '@frontend/components/layout/Sidebar';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { SIDEBAR_PINNED_COOKIE } from '@frontend/constants/sidebar';
import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY, PROFILE_QUERY_KEY } from '@frontend/lib/query-keys';

import type { User } from '@shared/types/user';

type DashboardShellData = Awaited<ReturnType<typeof loadDashboardShell>>;

/**
 * What the sidebar shows from the first paint: the username and avatar, instead of a placeholder
 * swapped after /api/profile. If a fetch fails, the sidebar fetches it as before.
 */
export async function loadDashboardShell(user: User) {
  const { profileApi, partiesApi } = await getApi();
  // No cookie: the person never chose, and the sidebar picks by the screen width
  const savedPinned = (await cookies()).get(SIDEBAR_PINNED_COOKIE)?.value;
  const sidebarPinned = savedPinned === undefined ? undefined : savedPinned !== 'false';
  const [profile, parties] = await Promise.all([
    profileApi.getProfile(user.id).catch(() => null),
    partiesApi.listMine().catch(() => null),
  ]);
  return { user, profile, parties, sidebarPinned };
}

/**
 * The signed-in app around a page: the sidebar and the content beside it. The dashboard layout
 * uses it, and so does the 404 of a signed-in person, so a wrong link keeps the menu.
 */
export default function DashboardShell({
  user,
  profile,
  parties,
  sidebarPinned,
  children,
}: DashboardShellData & { children: ReactNode }) {
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

            {/* Content area: the main landmark, beside the sidebar and not around it, so "Skip to
                content" lands on the page. Positioned: a sheet's background art fills this whole
                area (SheetBackdrop) */}
            <MainContent className="relative min-w-0 flex-1">
              {/* Same width, side and top spacing on every dashboard page; collapsing the menu
                  only gives the page more room if its limit grows too */}
              <div className="mx-auto w-full max-w-5xl px-4 py-6 group-has-[[data-sidebar=rail]]/dashboard:max-w-7xl sm:px-6 md:py-10">
                {children}
              </div>
            </MainContent>
          </div>
        </UserProvider>
      </SeededQuery>
    </SeededQuery>
  );
}
