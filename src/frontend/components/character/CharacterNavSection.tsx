'use client';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { useSheetTabs } from '@frontend/components/character/sheet/useSheetTabs';
import { NavItem, navLabelClass, useSidebarExpanded } from '@frontend/components/ui/nav-item';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

export default function CharacterNavSection({ characterId }: { characterId: string }) {
  // The sheet loads the character (with the server's copy); fetching here too would race it
  const { character } = useCharacter(characterId, { fetch: false });
  const expanded = useSidebarExpanded();
  const { classLabel } = useCharacterChoices();
  const tabs = useSheetTabs(characterId, character?.system);

  const characterName = character?.name;
  const avatarUrl = character?.avatarUrl;

  if (!characterName || !character?.system) return null;

  return (
    <section
      className="character-context animate-in fade-in slide-in-from-left-2 flex flex-col gap-4 duration-300"
      style={characterTheme(character.accentColor).style}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border transition-[padding,background-color,border-color] duration-200',
          expanded ? 'border-character-muted bg-character-surface p-2' : 'border-transparent',
        )}
      >
        <CharacterPortrait
          avatarUrl={avatarUrl}
          characterClass={character.class}
          className={cn(
            'shrink-0 transition-all duration-200',
            expanded ? 'h-12 w-12' : 'h-10 w-10',
          )}
        />
        <div className={cn(navLabelClass(expanded), 'flex flex-col')}>
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

      <div className="flex flex-col gap-1">
        {tabs.map((item) => (
          <NavItem
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.isActive}
            isSubItem
          />
        ))}
      </div>
    </section>
  );
}
