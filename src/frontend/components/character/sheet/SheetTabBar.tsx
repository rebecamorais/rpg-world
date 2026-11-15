'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { cn } from '@frontend/lib/utils';

import { useSheetTabs } from './useSheetTabs';

/**
 * The sheet's tabs at the bottom of a phone, in reach of the thumb: in the side menu they sit
 * behind the menu button. From md up they're in the side menu only. Between sm and md (a tablet
 * standing, a desktop at 200% zoom) the side menu is already open, so the bar starts to its
 * right (`--sidebar-offset`, globals.css): under it, Status and Lore were covered.
 */
export function SheetTabBar({ characterId, system }: { characterId: string; system: string }) {
  const t = useTranslations('characters.tabs');
  const tabs = useSheetTabs(characterId, system);

  return (
    <nav
      data-scroll-pad="sheet-tabs"
      aria-label={t('label')}
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-[left] duration-200 ease-out sm:left-(--sidebar-offset) md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <AppLink
              href={tab.href}
              aria-current={tab.isActive ? 'page' : undefined}
              className={cn(
                'focus-ring flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors',
                tab.isActive
                  ? 'text-character-flare font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <AppIcon name={tab.icon} size={20} aria-hidden="true" />
              {tab.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
