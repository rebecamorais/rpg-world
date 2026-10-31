'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@frontend/components/ui/card';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { PartyPerson, RosterCharacter } from '@backend/contexts/parties/domain/PartyView';

import { CharacterIdentity } from './RolePlayCard';

/** What players see of the characters at the table: only the basics, no sheet behind them. */
export function PartyRoster({
  roster,
  people,
}: {
  roster: RosterCharacter[];
  people: PartyPerson[];
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
                <CharacterIdentity character={character} />
                <p className="text-label text-muted-foreground">
                  {username ? t('playedBy', { username }) : t('playedByUnnamed')}
                </p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
