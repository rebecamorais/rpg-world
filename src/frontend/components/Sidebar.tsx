'use client';

import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/CharacterNavSection';
import { NavItem } from '@frontend/components/ui/nav-item';

export default function Sidebar() {
  const params = useParams();
  const characterId = params?.id as string;
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <aside className="bg-sidebar border-border hidden w-64 flex-col border-r p-6 sm:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="bg-primary h-6 w-6 rounded" />
        <span className="truncate font-bold tracking-tight">{tCommon('title')}</span>
      </div>

      <nav className="flex flex-col gap-6">
        <section>
          <p className="mb-2 px-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
            {tDash('menu')}
          </p>
          <NavItem href="/settings/profile" label={tDash('myProfile')} />
          <NavItem href="/characters" label={tDash('myCharacters')} />
        </section>

        {characterId && <CharacterNavSection characterId={characterId} />}
      </nav>
    </aside>
  );
}
