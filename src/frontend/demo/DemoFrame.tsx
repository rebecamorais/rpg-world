'use client';

import { type ReactNode, useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { localizedHref } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/character/CharacterNavSection';
import { Button } from '@frontend/components/ui/button';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useSession } from '@frontend/hooks/useSession';

import { DemoInvite } from './DemoInvite';

/**
 * The header's height, for what sticks to the top below it (`--sticky-top`: the VitalsBar, the
 * Grimoire's index and level titles). Measured: the banner wraps on narrow screens.
 */
function useHeaderHeight() {
  // A callback ref (state, not useRef): the effect runs again if the header element changes
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!header || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setHeight(header.offsetHeight));
    observer.observe(header);
    return () => observer.disconnect();
  }, [header]);
  return { ref: setHeader, height };
}

/** The demo's own header, banner and navigation: no sidebar, profile or account menus. */
export function DemoFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('demo');
  const locale = useLocale();
  const pathname = usePathname();
  const { id } = useParams<{ id?: string }>();
  const { status } = useSession();
  const { ref: headerRef, height: headerHeight } = useHeaderHeight();

  const links = [
    { href: '/demo', label: t('nav.overview'), icon: 'Users', active: pathname === '/demo' },
    {
      href: '/demo/inventory',
      label: t('nav.chest'),
      icon: 'Backpack',
      active: pathname === '/demo/inventory',
    },
    { href: '/demo/npcs', label: t('nav.npcs'), icon: 'Skull', active: pathname === '/demo/npcs' },
  ];

  return (
    <>
      {/* Fixed only from md up: on a phone it took a quarter of the screen with the tab bar, and
          scrolls away with the page instead (the invite still offers the account) */}
      <header
        ref={headerRef}
        data-scroll-pad="demo-header"
        className="border-border bg-card z-40 border-b md:sticky md:top-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-8">
          <p className="text-muted-foreground min-w-0 text-sm">{t('banner.text')}</p>
          <Button asChild size="sm">
            {status === 'signed-in' ? (
              <Link href="/characters">{t('banner.back')}</Link>
            ) : (
              <Link href={localizedHref('/register', locale)}>{t('banner.signUp')}</Link>
            )}
          </Button>
        </div>
        <nav
          aria-label={t('nav.label')}
          className="border-border flex gap-1 overflow-x-auto border-t px-4 py-1 sm:px-8"
        >
          {links.map((link) => (
            <div key={link.href} className="shrink-0">
              <NavItem
                href={link.href}
                label={link.label}
                icon={link.icon}
                isActive={link.active}
              />
            </div>
          ))}
        </nav>
      </header>
      {/* --sticky-top only where the header sticks (md up); the guess until it is measured */}
      <div
        style={
          headerHeight === null
            ? undefined
            : ({ '--demo-header-height': `${headerHeight}px` } as React.CSSProperties)
        }
        className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-10 md:[--sticky-top:var(--demo-header-height,6.125rem)]"
      >
        {/* On a phone the tab bar at the bottom already has the sheet's tabs */}
        {id && (
          <aside className="hidden w-56 shrink-0 md:block">
            <CharacterNavSection characterId={id} />
          </aside>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl min-w-0 flex-1 outline-none"
        >
          {children}
        </main>
      </div>
      <DemoInvite />
    </>
  );
}
