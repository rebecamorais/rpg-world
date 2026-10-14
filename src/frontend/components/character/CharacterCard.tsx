'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { CharacterSummary } from '@shared/types/character';

interface CharacterCardProps {
  character: CharacterSummary;
}

/**
 * A premium card representing a character in the dashboard list.
 * Features glassmorphism, dynamic accent colors, and optimized mobile layout.
 */
export function CharacterCard({ character }: CharacterCardProps) {
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');
  const { setCharacterToDelete } = useCharactersContext();

  const theme = characterTheme(character.accentColor);

  const href = `/system/${character.system}/character/${character.id}`;

  /*
   * The whole card is clickable through the name's link (stretched over the card with ::after),
   * so the actions menu is a sibling of the link instead of a button inside it.
   */
  return (
    <div className={cn(theme.className, 'group relative h-full')} style={theme.style}>
      <Card
        className={cn(
          'border-character-muted relative h-full overflow-hidden border shadow-[0_20px_40px_-20px_var(--character-muted)] transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl sm:border-2',
          'bg-card/40 has-[a:focus-visible]:outline-ring backdrop-blur-xl has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2',
        )}
      >
        {/* Accent color bar */}
        <div className="bg-character absolute top-0 left-0 h-1.5 w-full opacity-80 transition-all duration-500 group-hover:h-2 group-hover:opacity-100" />

        {/* Background decoration */}
        <div className="bg-character pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20" />

        <CardContent className="flex h-full flex-col p-5 sm:p-6">
          <div className="mb-5 flex flex-col items-start gap-2">
            <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
              <h2 className="text-title text-character-flare truncate">
                <Link href={href} className="outline-none after:absolute after:inset-0">
                  {character.name}
                </Link>
              </h2>
              <Badge
                variant="secondary"
                className="text-label bg-muted/80 border-l-character shrink-0 border-l-[3px] px-2.5 py-1"
              >
                {t('levelShort', { level: character.level })}
              </Badge>
            </div>
            <p className="text-label text-muted-foreground line-clamp-1">
              {character.class || t('defaultClass')}
            </p>
          </div>

          <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
            <div className="text-label text-muted-foreground flex items-center gap-2">
              <AppIcon name="Swords" size={14} className="text-character-flare" />
              <span>{character.system.replace('_', ' ')}</span>
            </div>

            {/* Above the stretched link; visible without hover, on touch too */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('cardActions', { name: character.name })}
                  className="text-muted-foreground hover:text-foreground relative z-10 h-8 w-8"
                >
                  <AppIcon name="Ellipsis" size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setCharacterToDelete(character)}
                >
                  <AppIcon name="Trash2" size={16} />
                  {tCommon('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Placeholder card while the list loads, same size as a CharacterCard. */
export function CharacterCardSkeleton() {
  return (
    <Card className="bg-card/40 flex h-full min-h-[180px] flex-col gap-4 p-5 sm:min-h-[220px] sm:p-6">
      <div className="bg-muted h-7 w-2/3 animate-pulse rounded-md" />
      <div className="bg-muted h-4 w-1/3 animate-pulse rounded-md" />
      <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
        <div className="bg-muted h-4 w-20 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
      </div>
    </Card>
  );
}
