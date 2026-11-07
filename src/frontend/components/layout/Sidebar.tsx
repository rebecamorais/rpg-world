'use client';

import { ReactNode, useState } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

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
import { SIDEBAR_PINNED_COOKIE } from '@frontend/constants/sidebar';
import { useAuth } from '@frontend/hooks/useAuth';
import { useParties } from '@frontend/hooks/useParties';
import { useProfile } from '@frontend/hooks/useProfile';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

/** Each party under "Parties"; the open one shows its pages (the settings only for its GM). */
function PartyLinks({ parties }: { parties: PartySummary[] }) {
  const pathname = usePathname();
  const t = useTranslations('parties.nav');

  return (
    <div className="flex flex-col">
      {parties.map((party) => {
        const href = `/parties/${party.id}`;
        const isOpen = pathname === href || pathname?.startsWith(`${href}/`);
        const pages = [
          { href: `${href}/journal`, label: t('journal') },
          { href: `${href}/inventory`, label: t('inventory') },
          ...(party.role === 'gm' ? [{ href: `${href}/settings`, label: t('settings') }] : []),
        ];
        return (
          <div key={party.id} className="flex flex-col">
            <NavItem href={href} label={party.name} isActive={isOpen} isSubItem />
            {isOpen && (
              <div className="ml-4 flex flex-col">
                <NavItem
                  href={href}
                  label={t('overview')}
                  isActive={!pages.some((page) => pathname.startsWith(page.href))}
                  isSubItem
                />
                {pages.map((page) => (
                  <NavItem
                    key={page.href}
                    href={page.href}
                    label={page.label}
                    isActive={pathname.startsWith(page.href)}
                    isSubItem
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UserAvatar() {
  const tCommon = useTranslations('common');
  const { profile } = useProfile();
  const username = profile?.username || tCommon('title');

  return (
    <Avatar className="ring-primary/20 border-border h-8 w-8 rounded-lg border ring-2 transition-all hover:scale-105 active:scale-95">
      {profile?.avatarUrl && (
        <AvatarImage src={profile.avatarUrl} alt={username} className="object-cover" />
      )}
      <AvatarFallback className="bg-primary/10 text-primary-flare text-xs font-bold">
        {username.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * `withLogout`: the phone drawer; on the desktop the header's user menu has "Sign out".
 * `action`: beside the username, the desktop menu's control to keep it open or collapse it.
 */
function SidebarContent({
  withLogout = false,
  action,
}: {
  withLogout?: boolean;
  action?: ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const characterId = params?.id as string;
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tParties = useTranslations('parties');
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const { parties } = useParties();

  const username = profile?.username || tCommon('title');

  return (
    <>
      <div className="flex flex-1 flex-col gap-8 pr-2">
        <div className="flex items-center gap-3 px-2">
          <UserAvatar />
          <div className="flex flex-col overflow-hidden">
            <span className="text-foreground truncate text-sm font-bold tracking-tight">
              {username}
            </span>
          </div>
          {action && <div className="ml-auto shrink-0">{action}</div>}
        </div>

        <nav className="flex flex-col gap-6">
          <section>
            <p className="text-label text-muted-foreground mb-2 px-3">{tDash('menu')}</p>
            <NavItem
              href="/settings/profile"
              label={tDash('myProfile')}
              icon="User"
              isActive={pathname?.startsWith('/settings')}
            />
            <NavItem
              href="/characters"
              label={tDash('myCharacters')}
              icon="Scroll"
              isActive={pathname?.startsWith('/characters')}
            />
            {/* An open party lights its own link below instead */}
            <NavItem
              href="/parties"
              label={tParties('nav.parties')}
              icon="Dices"
              isActive={pathname === '/parties'}
            />
            {parties && <PartyLinks parties={[...parties.asGm, ...parties.asPlayer]} />}
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href="/characters/new">
                <AppIcon name="Plus" size={16} aria-hidden="true" />
                {tDash('newCharacter')}
              </Link>
            </Button>
          </section>

          {characterId && <CharacterNavSection characterId={characterId} />}
        </nav>
      </div>

      {withLogout && (
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
      )}
    </>
  );
}

function PinButton({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  const t = useTranslations('dashboard');
  const label = pinned ? t('collapseMenu') : t('keepMenuOpen');

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label={label} title={label}>
      <AppIcon name={pinned ? 'PinOff' : 'Pin'} size={16} aria-hidden="true" />
    </Button>
  );
}

/** The collapsed menu: the main links and the open sheet's tabs, as icons. */
function SidebarRail({ action }: { action: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const characterId = params?.id as string;
  const tDash = useTranslations('dashboard');
  const tParties = useTranslations('parties');

  return (
    <div className="sticky top-4 flex flex-col items-center gap-4">
      <UserAvatar />
      {action}
      <nav aria-label={tDash('menu')} className="flex flex-col items-center gap-1">
        <NavItem
          href="/settings/profile"
          label={tDash('myProfile')}
          icon="User"
          iconOnly
          isActive={pathname?.startsWith('/settings')}
        />
        <NavItem
          href="/characters"
          label={tDash('myCharacters')}
          icon="Scroll"
          iconOnly
          isActive={pathname?.startsWith('/characters')}
        />
        <NavItem
          href="/parties"
          label={tParties('nav.parties')}
          icon="Dices"
          iconOnly
          isActive={pathname?.startsWith('/parties')}
        />
        <Button asChild size="icon" className="mt-2">
          <Link
            href="/characters/new"
            aria-label={tDash('newCharacter')}
            title={tDash('newCharacter')}
          >
            <AppIcon name="Plus" size={16} aria-hidden="true" />
          </Link>
        </Button>
        {characterId && (
          <div className="mt-3">
            <CharacterNavSection characterId={characterId} compact />
          </div>
        )}
      </nav>
    </div>
  );
}

/**
 * Desktop navigation; on phones the same content opens from the header (MobileMenu). Open by
 * default. Collapsed, it's a strip of icons, and hovering it brings the whole menu over the page,
 * without moving the page. The keyboard goes through the icons, which reach the same main pages.
 * The dashboard layout gives the page more width when it sees `data-sidebar="rail"`.
 */
export default function Sidebar({ initialPinned = true }: { initialPinned?: boolean }) {
  const [pinned, setPinned] = useState(initialPinned);

  const toggle = () => {
    const next = !pinned;
    setPinned(next);
    document.cookie = `${SIDEBAR_PINNED_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  const pinButton = <PinButton pinned={pinned} onToggle={toggle} />;

  if (pinned) {
    return (
      <aside
        data-sidebar="pinned"
        className="bg-sidebar border-border hidden w-64 flex-col border-r px-6 pt-6 pb-2 sm:flex"
      >
        <SidebarContent action={pinButton} />
      </aside>
    );
  }

  return (
    <aside
      data-sidebar="rail"
      className="group/rail bg-sidebar border-border relative z-30 hidden w-16 shrink-0 flex-col border-r pt-6 pb-2 sm:flex"
    >
      <SidebarRail action={pinButton} />
      <div
        data-testid="sidebar-drawer"
        className="bg-sidebar border-border invisible absolute inset-y-0 left-0 w-64 border-r opacity-0 shadow-2xl transition-[opacity,visibility] duration-150 group-hover/rail:visible group-hover/rail:opacity-100 group-hover/rail:delay-100"
      >
        {/* Stays on screen on a long page, where the drawer itself runs past the fold */}
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto px-6 pt-6 pb-2">
          <SidebarContent action={pinButton} />
        </div>
      </div>
    </aside>
  );
}

/** Header button that opens the navigation in a drawer, on phones only. */
export function MobileMenu() {
  const tDash = useTranslations('dashboard');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={tDash('openMenu')} className="sm:hidden">
          <AppIcon name="Menu" size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar border-border text-foreground flex w-72 flex-col px-6 pt-6 pb-2 sm:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{tDash('menu')}</SheetTitle>
          <SheetDescription>{tDash('menuDescription')}</SheetDescription>
        </SheetHeader>
        <SidebarContent withLogout />
      </SheetContent>
    </Sheet>
  );
}
