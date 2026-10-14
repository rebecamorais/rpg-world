'use client';

import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/character/CharacterNavSection';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { NavItem } from '@frontend/components/ui/nav-item';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@frontend/components/ui/sheet';
import { useAuth } from '@frontend/hooks/useAuth';
import { useProfile } from '@frontend/hooks/useProfile';

function SidebarContent() {
  const params = useParams();
  const characterId = params?.id as string;
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { profile } = useProfile();
  const { signOut } = useAuth();

  const username = profile?.username || tCommon('title');
  const avatarUrl = profile?.avatarUrl;

  return (
    <>
      <div className="flex flex-1 flex-col gap-8 pr-2">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="ring-primary/20 border-border h-8 w-8 rounded-lg border ring-2 transition-all hover:scale-105 active:scale-95">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={username} className="object-cover" />
            ) : (
              <div className="bg-primary/20 h-full w-full" />
            )}
            <AvatarFallback className="bg-primary/10 text-primary-flare text-xs font-bold">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-foreground truncate text-sm font-bold tracking-tight">
              {username}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-6">
          <section>
            <p className="text-label text-muted-foreground mb-2 px-3">{tDash('menu')}</p>
            <NavItem href="/settings/profile" label={tDash('myProfile')} />
            <NavItem href="/characters" label={tDash('myCharacters')} />
          </section>

          {characterId && <CharacterNavSection characterId={characterId} />}
        </nav>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => signOut()}
          className="group text-muted-foreground hover:bg-danger-surface hover:text-danger-flare mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
        >
          <AppIcon
            name="LogOut"
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          <span>{tCommon('logout')}</span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const tDash = useTranslations('dashboard');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-sidebar border-border hidden w-64 flex-col border-r px-6 pt-6 pb-2 sm:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Trigger - floating bottom right for easy access */}
      <div className="fixed right-6 bottom-6 z-50 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              aria-label={tDash('menu')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 w-14 rounded-full shadow-lg"
            >
              <AppIcon name="Menu" size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-sidebar border-border text-foreground flex w-64 flex-col px-6 pt-6 pb-2 sm:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{tDash('menu')}</SheetTitle>
              <SheetDescription>{tDash('menuDescription')}</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
