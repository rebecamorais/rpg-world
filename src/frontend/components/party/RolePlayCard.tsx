'use client';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { SheetPreview } from '@frontend/components/character/sheet/SheetPreview';
import { ViewImageButton } from '@frontend/components/shared/ViewImageButton';
import { Card, CardContent } from '@frontend/components/ui/card';
import AppLink from '@frontend/demo/AppLink';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type {
  RolePlayCard as RolePlayCardData,
  RosterCharacter,
} from '@backend/contexts/parties/domain/PartyView';

const NAME_CLASS = 'text-title text-character-flare line-clamp-2 break-normal hyphens-auto';

/**
 * Avatar, name and "level · race · class" of a character at the table. With `href`, only the name
 * is a link to the sheet. Nothing is cut short: the name takes two lines (all of it in the
 * tooltip), and the details wrap with the level first, so a narrow card never hides it.
 */
export function CharacterIdentity({
  character,
  href,
  withAvatar = true,
}: {
  character: Pick<RosterCharacter, 'name' | 'avatarUrl' | 'race' | 'class' | 'level'>;
  href?: string;
  /** False where the picture is shown elsewhere (the combat card's portrait). */
  withAvatar?: boolean;
}) {
  const t = useTranslations('parties.page');
  const choices = useCharacterChoices();
  const details = [
    t('level', { level: character.level }),
    choices.raceLabel(character.race),
    choices.classLabel(character.class),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex min-w-0 items-center gap-3">
      {withAvatar && (
        <CharacterPortrait
          avatarUrl={character.avatarUrl}
          characterClass={character.class}
          className="h-12 w-12 shrink-0"
        />
      )}
      <div className="flex min-w-0 flex-col">
        {href ? (
          <AppLink
            href={href}
            title={character.name}
            className={cn(NAME_CLASS, 'focus-ring rounded-sm hover:underline')}
          >
            {character.name}
          </AppLink>
        ) : (
          <span title={character.name} className={NAME_CLASS}>
            {character.name}
          </span>
        )}
        <span className="text-caption text-muted-foreground">{details}</span>
      </div>
    </div>
  );
}

const LORE_FIELDS = ['personalityTraits', 'ideals', 'bonds', 'flaws'] as const;

/**
 * A character in the GM's Role Play view; a click anywhere on the card opens the read-only sheet.
 * The stretched link is out of the Tab order: the keyboard opens the sheet with "View sheet" (the
 * same sheet, without leaving the table), after "View image" when the character has an avatar.
 */
export function RolePlayCard({ partyId, card }: { partyId: string; card: RolePlayCardData }) {
  const t = useTranslations('parties.page');
  const theme = characterTheme(card.accentColor ?? undefined);

  return (
    <div className={cn(theme.className, 'group relative h-full')} style={theme.style}>
      <Card className="border-character-muted bg-card/60 relative h-full overflow-hidden border transition-transform group-hover:-translate-y-0.5">
        <div className="bg-character absolute top-0 left-0 h-1 w-full opacity-80" />
        <ViewImageButton src={card.avatarUrl} name={card.name} className="absolute top-3 right-3" />
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/*
            The link is stretched over the card (::after), for the pointer. Out of the Tab order
            (8 players were 16 stops), but not aria-hidden: it holds the character's name
          */}
          <AppLink
            href={`/parties/${partyId}/characters/${card.characterId}`}
            tabIndex={-1}
            className="pr-8 outline-none after:absolute after:inset-0"
          >
            <CharacterIdentity character={card} />
          </AppLink>
          <p className="text-caption text-muted-foreground -mt-2">
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

          {/* Above the stretched link (z-10): the whole sheet, read-only, without leaving */}
          <div className="relative z-10 mt-auto">
            <SheetPreview
              characterId={card.characterId}
              name={card.name}
              source={{ kind: 'party', partyId }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
