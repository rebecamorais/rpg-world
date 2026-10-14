import { redirect } from 'next/navigation';

import { getApi } from '@api';

import Sidebar from '@frontend/components/layout/Sidebar';
import { UserProvider } from '@frontend/context/UserContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
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
  );
}
