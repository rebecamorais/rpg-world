'use client';

import { useTranslations } from 'next-intl';

import { SheetPreview } from '@frontend/components/character/sheet/SheetPreview';
import { ViewImageButton } from '@frontend/components/shared/ViewImageButton';
import { Card, CardContent } from '@frontend/components/ui/card';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { PartyPerson, RosterCharacter } from '@backend/contexts/parties/domain/PartyView';

import { CharacterIdentity } from './RolePlayCard';

/** What players see of the characters at the table: only the basics, no sheet behind them. */
export function PartyRoster({
  roster,
  people,
  myCharacterIds = [],
  emptyAction,
}: {
  roster: RosterCharacter[];
  people: PartyPerson[];
  /** The ones the person looking brought: theirs to open whole. */
  myCharacterIds?: string[];
  /** The way to bring someone, shown while the table is empty. */
  emptyAction?: React.ReactNode;
}) {
  const t = useTranslations('parties.page');
  const usernames = new Map(people.map((p) => [p.userId, p.username]));

  if (roster.length === 0) {
    return (
      <EmptyState
        icon="Users"
        title={t('noCharactersPlayer')}
        description={t('noCharactersPlayerHint')}
        action={emptyAction}
      />
    );
  }

  return (
    // Columns follow the room the list has, not the screen: the sidebar takes 256px of it
    <div className="@container">
      <ul className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
        {roster.map((character) => {
          const theme = characterTheme(character.accentColor ?? undefined);
          const username = usernames.get(character.ownerId);
          return (
            <li
              key={character.characterId}
              className={cn(theme.className, 'h-full')}
              style={theme.style}
            >
              {/* Same height as the neighbour in its row, with or without "View sheet" */}
              <Card className="border-character-muted bg-card/60 h-full border">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <CharacterIdentity character={character} />
                    <ViewImageButton src={character.avatarUrl} name={character.name} />
                  </div>
                  <p className="text-caption text-muted-foreground">
                    {username ? t('playedBy', { username }) : t('playedByUnnamed')}
                  </p>
                  {/* Their own characters: the whole sheet, read-only, and "Edit sheet" from it */}
                  {myCharacterIds.includes(character.characterId) && (
                    <div className="self-start">
                      <SheetPreview
                        characterId={character.characterId}
                        name={character.name}
                        source={{ kind: 'own' }}
                        canEdit
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
