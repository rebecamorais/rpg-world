'use client';

import { useTranslations } from 'next-intl';

import { SheetPreview } from '@frontend/components/character/sheet/SheetPreview';
import { ViewImageButton } from '@frontend/components/shared/ViewImageButton';
import { Card, CardContent } from '@frontend/components/ui/card';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { PartyPerson, RosterCharacter } from '@backend/contexts/parties/domain/PartyView';

import { CharacterIdentity } from './RolePlayCard';

/** What players see of the characters at the table: only the basics, no sheet behind them. */
export function PartyRoster({
  roster,
  people,
  myCharacterIds = [],
}: {
  roster: RosterCharacter[];
  people: PartyPerson[];
  /** The ones the person looking brought: theirs to open whole. */
  myCharacterIds?: string[];
}) {
  const t = useTranslations('parties.page');
  const usernames = new Map(people.map((p) => [p.userId, p.username]));

  if (roster.length === 0) {
    return <p className="text-muted-foreground">{t('noCharactersPlayer')}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {roster.map((character) => {
        const theme = characterTheme(character.accentColor ?? undefined);
        const username = usernames.get(character.ownerId);
        return (
          <li key={character.characterId} className={cn(theme.className)} style={theme.style}>
            <Card className="border-character-muted bg-card/60 border">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <CharacterIdentity character={character} />
                  <ViewImageButton src={character.avatarUrl} name={character.name} />
                </div>
                <p className="text-label text-muted-foreground">
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
  );
}
