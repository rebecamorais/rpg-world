import Sidebar from '@/frontend/components/Sidebar';

export default function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-sidebar flex flex-1 text-zinc-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex w-full flex-1 flex-col items-center">
        {children}
      </main>
    </div>
  );
}
