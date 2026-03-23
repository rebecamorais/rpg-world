'use client';

import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/CharacterNavSection';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useProfile } from '@frontend/hooks/useProfile';

export default function Sidebar() {
  const params = useParams();
  const characterId = params?.id as string;
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { profile, isLoading } = useProfile();

  const username = profile?.username || tCommon('title');
  const avatarUrl = profile?.avatarUrl;

  return (
    <aside className="bg-sidebar border-border hidden w-64 flex-col border-r p-6 sm:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Avatar className="ring-primary/20 h-8 w-8 rounded-lg border border-white/10 ring-2 transition-all hover:scale-105 active:scale-95">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={username} className="object-cover" />
          ) : (
            <div className="bg-primary/20 h-full w-full" />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-bold tracking-tight text-white/90">
            {username}
          </span>
        </div>
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
