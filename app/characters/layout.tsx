'use client';

import { useParams } from 'next/navigation';

import { NavItem } from '@/frontend/components/nav-item';

export default function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const characterId = params?.id;

  return (
    <div className="bg-sidebar flex min-h-screen text-zinc-100">
      {/* Sidebar */}
      <aside className="bg-sidebar fixed h-full w-64 overflow-y-auto border-r border-zinc-800 p-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="bg-primary h-6 w-6 rounded" />
          <span className="font-bold tracking-tight">RPG WORLD</span>
        </div>

        <nav className="flex flex-col gap-6">
          <section>
            <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Menu
            </p>
            <NavItem href="/characters" label="Meus Personagens" />
          </section>

          {characterId && (
            <section className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-primary mb-2 px-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Personagem Atual
              </p>
              <div className="flex flex-col gap-1">
                <NavItem
                  href={`/characters/${characterId}`}
                  label="Atributos"
                  isSubItem
                />
                <NavItem
                  href={`/characters/${characterId}/spells`}
                  label="Spells"
                  isSubItem
                />
              </div>
            </section>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
