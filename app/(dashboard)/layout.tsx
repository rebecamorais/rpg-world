import { redirect } from 'next/navigation';

import { getApi } from '@api';

import Sidebar from '@/frontend/components/Sidebar';
import { UserProvider } from '@/frontend/context/UserContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <UserProvider user={user}>
      <div className="bg-sidebar flex flex-1 text-zinc-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex w-full flex-1 flex-col items-center">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
