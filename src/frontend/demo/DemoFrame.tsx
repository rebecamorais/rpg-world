'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterNavSection from '@frontend/components/character/CharacterNavSection';
import { Button } from '@frontend/components/ui/button';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useSession } from '@frontend/hooks/useSession';

import { DemoInvite } from './DemoInvite';

/** The demo's own header, banner and navigation: no sidebar, profile or account menus. */
export function DemoFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('demo');
  const pathname = usePathname();
  const { id } = useParams<{ id?: string }>();
  const { status } = useSession();

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
      <header
        data-scroll-pad="demo-header"
        className="border-border bg-card sticky top-0 z-40 border-b"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-8">
          <p className="text-muted-foreground min-w-0 text-sm">{t('banner.text')}</p>
          <Button asChild size="sm">
            {status === 'signed-in' ? (
              <Link href="/characters">{t('banner.back')}</Link>
            ) : (
              <Link href="/register">{t('banner.signUp')}</Link>
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
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-10">
        {id && (
          <aside className="w-full shrink-0 md:w-56">
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
