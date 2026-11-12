'use client';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import type { IconName } from '@frontend/components/ui/icon';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { CharacterTab } from '@frontend/types/character-sheet';

export interface SheetTabLink {
  id: CharacterTab;
  label: string;
  icon: IconName;
  href: string;
  isActive: boolean;
}

/** The sheet's tabs, for the side menu and the phone's tab bar alike. */
export function useSheetTabs(characterId: string, system?: string): SheetTabLink[] {
  const t = useTranslations('characters.tabs');
  const pathname = usePathname();
  const { pagesPath } = useSheetSource(characterId, system);

  const tabs: Omit<SheetTabLink, 'isActive'>[] = [
    { id: CharacterTab.STATUS, label: t('status'), icon: 'Shield', href: pagesPath },
    { id: CharacterTab.LORE, label: t('lore'), icon: 'Files', href: `${pagesPath}/lore` },
    { id: CharacterTab.SPELLS, label: t('spells'), icon: 'BookOpen', href: `${pagesPath}/spells` },
    {
      id: CharacterTab.INVENTORY,
      label: t('inventory'),
      icon: 'Sword',
      href: `${pagesPath}/inventory`,
    },
  ];

  return tabs.map((tab) => ({
    ...tab,
    // Status is the sheet's root: every other tab's path starts with it
    isActive:
      tab.id === CharacterTab.STATUS ? pathname === tab.href : !!pathname?.startsWith(tab.href),
  }));
}
