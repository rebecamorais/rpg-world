'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
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

  return (
    <div className={cn(theme.className, 'group relative h-full')} style={theme.style}>
      <Link href={`/system/${character.system}/character/${character.id}`} className="block h-full">
        <Card
          className={cn(
            'border-character-muted relative h-full overflow-hidden border shadow-[0_20px_40px_-20px_var(--character-muted)] transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl sm:border-2',
            'bg-card/40 backdrop-blur-xl',
            'hover:border-transparent',
          )}
        >
          {/* Accent Color Indicator (Top Bar) - Thicker on hover */}
          <div className="bg-character absolute top-0 left-0 h-1.5 w-full opacity-80 transition-all duration-500 group-hover:h-2 group-hover:opacity-100" />

          {/* Background Decorative Element */}
          <div className="bg-character absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20" />

          <CardContent className="flex h-full flex-col p-5 sm:p-6">
            <div className="mb-5 flex flex-col items-start gap-2">
              <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                <h3 className="font-display text-character-flare truncate text-xl font-bold sm:text-2xl">
                  {character.name}
                </h3>
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

            <div className="border-muted/20 mt-auto flex items-center justify-between border-t pt-4">
              <div className="text-label text-muted-foreground flex items-center gap-2">
                <AppIcon name="Swords" size={14} className="text-character-flare" />
                <span>{character.system.replace('_', ' ')}</span>
              </div>

              {/* Delete: always visible on touch screens; on desktop it shows on hover or keyboard focus */}
              <div className="bg-character-surface border-character-muted text-character-flare flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 focus-within:opacity-100 sm:opacity-0">
                <Button
                  variant="destructive"
                  size="icon"
                  title={tCommon('delete')}
                  aria-label={tCommon('delete')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCharacterToDelete(character);
                  }}
                  className="h-8 w-8 rounded-full shadow-xl transition-transform active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
                >
                  <AppIcon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          </CardContent>

          {/* Hover Glow Effect */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--character-primary),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-5" />
        </Card>
      </Link>
    </div>
  );
}
