import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getApi } from '@api';

import Sidebar from '@frontend/components/layout/Sidebar';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY, PROFILE_QUERY_KEY } from '@frontend/lib/query-keys';

import { PATHNAME_HEADER } from '@shared/http/pathname-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authApi, profileApi, partiesApi } = await getApi();
  const user = await authApi.getSessionUser();

  // The page that was asked for (a sheet, an invite), to come back to after login or onboarding
  const asked = (await headers()).get(PATHNAME_HEADER);
  const back = asked && asked !== '/characters' ? `?next=${encodeURIComponent(asked)}` : '';

  if (!user) {
    redirect(`/login${back}`);
  }

  // The sidebar shows the username and avatar from the first paint, instead of a placeholder
  // swapped after /api/profile. The layout stays mounted while navigating the dashboard, so this
  // only runs on a full page load. If it fails, the sidebar fetches it as before.
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
          <div className="bg-sidebar text-foreground flex min-h-[calc(100vh-var(--header-height))]">
            {/* Sidebar */}
            <Sidebar />

            {/* Content area (the main landmark is in the root layout) */}
            <div className="min-w-0 flex-1">
              {/* Same width, side and top spacing on every dashboard page */}
              <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10">{children}</div>
            </div>
          </div>
        </UserProvider>
      </SeededQuery>
    </SeededQuery>
  );
}
