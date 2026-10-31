'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Card, CardContent } from '@frontend/components/ui/card';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type {
  RolePlayCard as RolePlayCardData,
  RosterCharacter,
} from '@backend/contexts/parties/domain/PartyView';

/** Avatar, name and "race · class · level" of a character at the table. */
export function CharacterIdentity({ character }: { character: RosterCharacter }) {
  const t = useTranslations('parties.page');
  const details = [character.race, character.class, t('level', { level: character.level })]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="border-border h-12 w-12 shrink-0 rounded-lg border">
        {character.avatarUrl && (
          <AvatarImage src={character.avatarUrl} alt="" className="object-cover" />
        )}
        <AvatarFallback className="bg-character-surface text-character-flare text-xs font-bold">
          {character.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="text-title text-character-flare truncate">{character.name}</span>
        <span className="text-label text-muted-foreground truncate">{details}</span>
      </div>
    </div>
  );
}

const LORE_FIELDS = ['personalityTraits', 'ideals', 'bonds', 'flaws'] as const;

/** A character in the GM's Role Play view; the whole card opens the read-only sheet. */
export function RolePlayCard({ partyId, card }: { partyId: string; card: RolePlayCardData }) {
  const t = useTranslations('parties.page');
  const theme = characterTheme(card.accentColor ?? undefined);

  return (
    <div className={cn(theme.className, 'group relative h-full')} style={theme.style}>
      <Card className="border-character-muted bg-card/60 has-[a:focus-visible]:outline-ring relative h-full overflow-hidden border transition-transform group-hover:-translate-y-0.5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2">
        <div className="bg-character absolute top-0 left-0 h-1 w-full opacity-80" />
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/* The link is stretched over the card (::after) */}
          <Link
            href={`/parties/${partyId}/characters/${card.characterId}`}
            className="outline-none after:absolute after:inset-0"
          >
            <CharacterIdentity character={card} />
          </Link>
          <p className="text-label text-muted-foreground -mt-2">
            {card.ownerUsername
              ? t('playedBy', { username: card.ownerUsername })
              : t('playedByUnnamed')}
          </p>

          <dl className="grid grid-cols-2 gap-3">
            {(['passivePerception', 'passiveInsight'] as const).map((key) => (
              <div key={key} className="bg-muted/40 border-border rounded-lg border px-3 py-2">
                <dt className="text-label text-muted-foreground">{t(key)}</dt>
                <dd className="font-mono text-xl font-bold">{card[key]}</dd>
              </div>
            ))}
          </dl>

          {LORE_FIELDS.some((key) => card[key]) && (
            <dl className="flex flex-col gap-2">
              {LORE_FIELDS.map((key) =>
                card[key] ? (
                  <div key={key}>
                    <dt className="text-label text-character-flare">{t(key)}</dt>
                    <dd className="text-body line-clamp-3 whitespace-pre-line">{card[key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
