'use client';

import { ReactNode, useState } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/character/CharacterNavSection';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  NavItem,
  SidebarExpandedContext,
  navLabelClass,
  navRowClass,
  useSidebarExpanded,
} from '@frontend/components/ui/nav-item';
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
import { cn } from '@frontend/lib/utils';

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
    <Avatar className="ring-primary/20 border-border h-8 w-8 rounded-lg border ring-2">
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
 * `action`: under the username, the desktop menu's control to keep it open or collapse it.
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
  const expanded = useSidebarExpanded();

  const username = profile?.username || tCommon('title');

  return (
    <>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-1">
            <UserAvatar />
            <span
              className={cn(
                navLabelClass(expanded),
                'text-foreground text-sm font-bold tracking-tight',
              )}
            >
              {username}
            </span>
          </div>
          {action}
        </div>

        <nav className="flex flex-col gap-6">
          <section>
            <p
              className={cn(
                'text-label text-muted-foreground mb-2 px-3 transition-opacity duration-200',
                !expanded && 'opacity-0',
              )}
            >
              {tDash('menu')}
            </p>
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
            {/* An open party lights its own link below instead; collapsed, they're out of view */}
            <NavItem
              href="/parties"
              label={tParties('nav.parties')}
              icon="Dices"
              isActive={expanded ? pathname === '/parties' : pathname?.startsWith('/parties')}
            />
            {parties && (
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200',
                  expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <PartyLinks parties={[...parties.asGm, ...parties.asPlayer]} />
                </div>
              </div>
            )}
            <Button
              asChild
              size="sm"
              className={cn(
                'mt-3 justify-start overflow-hidden px-3 transition-[width] duration-200',
                expanded ? 'w-full' : 'w-10',
              )}
            >
              <Link href="/characters/new">
                <AppIcon name="Plus" size={16} aria-hidden="true" className="shrink-0" />
                <span className={navLabelClass(expanded)}>{tDash('newCharacter')}</span>
              </Link>
            </Button>
          </section>

          {characterId && <CharacterNavSection characterId={characterId} />}
        </nav>
      </div>

      {withLogout && (
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => signOut()}
            className="group focus-ring text-muted-foreground hover:bg-danger-surface hover:text-danger-flare mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
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
  const expanded = useSidebarExpanded();
  const label = pinned ? t('collapseMenu') : t('keepMenuOpen');

  return (
    <button type="button" onClick={onToggle} title={label} className={navRowClass(expanded)}>
      <AppIcon name={pinned ? 'PinOff' : 'Pin'} size={16} aria-hidden="true" className="shrink-0" />
      <span className={navLabelClass(expanded)}>{label}</span>
    </button>
  );
}

/**
 * Desktop navigation; on phones the same content opens from the header (MobileMenu). Open by
 * default. Collapsed, it's a strip of icons that grows over the page on hover or keyboard focus,
 * without moving the page: reflowing a sheet at every pass of the mouse would be disorienting.
 * The content keeps its full width and the panel clips it, so the icons stay where they are.
 * The dashboard layout gives the page more width when it sees `data-sidebar="rail"`.
 */
export default function Sidebar({ initialPinned = true }: { initialPinned?: boolean }) {
  const [pinned, setPinned] = useState(initialPinned);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = pinned || hovered || focused;

  const toggle = () => {
    const next = !pinned;
    setPinned(next);
    document.cookie = `${SIDEBAR_PINNED_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      data-sidebar={pinned ? 'pinned' : 'rail'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Only the keyboard: a clicked link keeps focus, and the menu must still close with the mouse
      onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      className={cn(
        'relative z-30 hidden shrink-0 transition-[width] duration-200 ease-out sm:block',
        pinned ? 'w-64' : 'w-16',
      )}
    >
      <SidebarExpandedContext.Provider value={expanded}>
        <div
          data-testid="sidebar-panel"
          data-expanded={expanded}
          className={cn(
            'bg-sidebar border-border absolute inset-y-0 left-0 overflow-clip border-r transition-[width,box-shadow] duration-200 ease-out',
            expanded ? 'w-64' : 'w-16',
            !pinned && expanded && 'shadow-2xl',
          )}
        >
          {/* Sticky: stays on screen on a long page, where the panel itself runs past the fold */}
          <div className="sticky top-0 flex max-h-screen w-64 flex-col overflow-x-hidden overflow-y-auto px-3 pt-6 pb-2">
            <SidebarContent action={<PinButton pinned={pinned} onToggle={toggle} />} />
          </div>
        </div>
      </SidebarExpandedContext.Provider>
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
