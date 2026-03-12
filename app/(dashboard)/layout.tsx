import { redirect } from 'next/navigation';

import { getApi } from '@api';

import Sidebar from '@frontend/components/Sidebar';
import { UserProvider } from '@frontend/context/UserContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <UserProvider user={user}>
      <div className="bg-sidebar flex h-[calc(100vh-57px)] overflow-hidden text-zinc-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex w-full flex-col items-center">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
