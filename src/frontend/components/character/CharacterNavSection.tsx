'use client';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';
import { CharacterTab } from '@frontend/types/character-sheet';

export default function CharacterNavSection({
  characterId,
  compact = false,
}: {
  characterId: string;
  /** For the collapsed menu: the portrait and the tabs' icons. */
  compact?: boolean;
}) {
  // The sheet loads the character (with the server's copy); fetching here too would race it
  const { character } = useCharacter(characterId, { fetch: false });
  const pathname = usePathname();
  const t = useTranslations('characters.tabs');
  const { classLabel } = useCharacterChoices();
  const { pagesPath } = useSheetSource(characterId, character?.system);

  const characterName = character?.name;
  const avatarUrl = character?.avatarUrl;

  if (!characterName || !character?.system) return null;

  const basePath = pagesPath;

  const navItems = [
    { id: CharacterTab.STATUS, label: t('status'), icon: 'Shield', href: basePath },
    { id: CharacterTab.LORE, label: t('lore'), icon: 'Files', href: `${basePath}/lore` },
    { id: CharacterTab.SPELLS, label: t('spells'), icon: 'BookOpen', href: `${basePath}/spells` },
    {
      id: CharacterTab.INVENTORY,
      label: t('inventory'),
      icon: 'Sword',
      href: `${basePath}/inventory`,
    },
  ];

  return (
    <section
      className={cn(
        'character-context animate-in fade-in slide-in-from-left-2 flex flex-col duration-300',
        compact ? 'items-center gap-2' : 'gap-4',
      )}
      style={characterTheme(character.accentColor).style}
    >
      {compact ? (
        <CharacterPortrait
          avatarUrl={avatarUrl}
          characterClass={character.class}
          className="h-9 w-9"
        />
      ) : (
        <div className="border-character-muted bg-character-surface flex items-center gap-3 rounded-xl border p-2">
          <CharacterPortrait
            avatarUrl={avatarUrl}
            characterClass={character.class}
            className="h-12 w-12"
          />
          <div className="flex min-w-0 flex-col">
            <span className="text-character-flare font-display truncate text-sm font-bold">
              {characterName}
            </span>
            {character.class && (
              <span className="text-label text-muted-foreground truncate">
                {classLabel(character.class)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.id === CharacterTab.STATUS
              ? pathname === item.href
              : pathname?.startsWith(item.href);

          return (
            <NavItem
              key={item.id}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isSubItem={!compact}
              iconOnly={compact}
            />
          );
        })}
      </div>
    </section>
  );
}
