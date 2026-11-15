'use client';

import { ReactNode, useRef, useState } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/character/CharacterNavSection';
import UserMenu from '@frontend/components/layout/UserMenu';
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
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';
import { useParties } from '@frontend/hooks/useParties';
import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

/** Each party under "Parties". Its pages (table, combat, journal, chest) are tabs on the party. */
function PartyLinks({ parties }: { parties: PartySummary[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col">
      {parties.map((party) => {
        const href = `/parties/${party.id}`;
        const isOpen = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <NavItem key={party.id} href={href} label={party.name} isActive={isOpen} isSubItem />
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
 * `action`: at the foot of the menu, the desktop control to keep it open or collapse it. Under
 * the username it read as an account item.
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
  const { parties } = useParties();
  const expanded = useSidebarExpanded();

  const username = profile?.username || tCommon('title');

  return (
    <>
      <div className="flex flex-1 flex-col gap-6">
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

        <nav aria-label={tDash('mainNavigation')} className="flex flex-col gap-6">
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

      {action && <div className="mt-auto pt-6">{action}</div>}

      {withLogout && (
        <div className="mt-auto pt-6">
          <UserMenu className="mb-2 w-full justify-start gap-3 px-3" />
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

/** From here the menu starts open when the person never chose; below, a rail leaves the page room. */
const WIDE = '(min-width: 64rem)';

/**
 * Desktop navigation; on phones the same content opens from the header (MobileMenu). With no
 * saved choice it's open from 1024px and a rail below; collapsing or pinning it is remembered.
 * Collapsed, it's a strip of icons that grows over the page on hover or keyboard focus,
 * without moving the page: reflowing a sheet at every pass of the mouse would be disorienting.
 * The content keeps its full width and the panel clips it, so the icons stay where they are.
 * The dashboard layout gives the page more width when it sees `data-sidebar="rail"`.
 *
 * `initialPinned`: the saved choice (cookie), or undefined when there is none.
 */
export default function Sidebar({ initialPinned }: { initialPinned?: boolean }) {
  const [choice, setChoice] = useState(initialPinned);
  // null on the server and while hydrating: then CSS picks the width (data-sidebar="auto")
  const wide = useMediaQuery(WIDE);
  const pinned = choice ?? wide;
  const mode = pinned === null ? 'auto' : pinned ? 'pinned' : 'rail';

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // After "Collapse menu" or Esc the strip closes at once, though the pointer or the focus is
  // still on it; it grows again only once that has left it
  const holdHover = useRef(false);
  const holdFocus = useRef(false);
  const expanded = pinned !== false || hovered || focused;

  const close = () => {
    holdHover.current = true;
    holdFocus.current = true;
    setHovered(false);
    setFocused(false);
  };

  const toggle = () => {
    const next = !pinned;
    setChoice(next);
    if (!next) close();
    document.cookie = `${SIDEBAR_PINNED_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      data-sidebar={mode}
      onMouseEnter={() => {
        if (!holdHover.current) setHovered(true);
      }}
      onMouseLeave={() => {
        holdHover.current = false;
        setHovered(false);
      }}
      // Only the keyboard: a clicked link keeps focus, and the menu must still close with the mouse
      onFocus={(e) => {
        if (!holdFocus.current) setFocused(e.target.matches(':focus-visible'));
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        holdFocus.current = false;
        setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && pinned === false && expanded) close();
      }}
      className={cn(
        'relative z-30 hidden shrink-0 transition-[width] duration-200 ease-out sm:block',
        // Mirrored by --sidebar-offset (globals.css), where the sheet's tab bar starts below md
        { pinned: 'w-64', rail: 'w-16', auto: 'w-16 lg:w-64' }[mode],
      )}
    >
      <SidebarExpandedContext.Provider value={expanded}>
        <div
          data-testid="sidebar-panel"
          data-expanded={expanded}
          className={cn(
            'bg-sidebar border-border absolute inset-y-0 left-0 overflow-clip border-r transition-[width,box-shadow] duration-200 ease-out',
            mode === 'auto' ? 'w-16 lg:w-64' : expanded ? 'w-64' : 'w-16',
            pinned === false && expanded && 'shadow-2xl',
          )}
        >
          {/* Sticky: stays on screen on a long page, where the panel itself runs past the fold.
              As tall as the screen under the header, so "Collapse menu" sits at its foot */}
          <div className="sticky top-0 flex h-[calc(100dvh-var(--header-height))] w-64 flex-col overflow-x-hidden overflow-y-auto px-3 pt-6 pb-2">
            <SidebarContent action={<PinButton pinned={pinned !== false} onToggle={toggle} />} />
          </div>
        </div>
      </SidebarExpandedContext.Provider>
    </aside>
  );
}

/** Header button that opens the navigation in a drawer, on phones only. */
export function MobileMenu() {
  const tDash = useTranslations('dashboard');
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={tDash('openMenu')} className="sm:hidden">
          <AppIcon name="Menu" size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar border-border text-foreground flex w-72 flex-col px-6 pt-6 pb-2 sm:hidden"
        // A tapped link closes the drawer: left open, it covered the page it had just opened
        onClick={(event) => {
          if ((event.target as Element).closest('a[href]')) setOpen(false);
        }}
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
