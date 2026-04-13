'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
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
  const tCommon = useTranslations('common');
  const { setCharacterToDelete } = useCharactersContext();

  const accentColor = character.accentColor || 'hsl(var(--primary))';

  return (
    <div className="group relative h-full">
      <Link href={`/system/${character.system}/character/${character.id}`} className="block h-full">
        <Card
          className={cn(
            'border-muted/20 relative h-full overflow-hidden border transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl sm:border-2',
            'bg-card/40 backdrop-blur-xl',
            'hover:border-transparent',
          )}
          style={{
            borderColor: character.accentColor ? `${character.accentColor}33` : undefined,
            boxShadow: character.accentColor
              ? `0 20px 40px -20px ${character.accentColor}33`
              : 'none',
          }}
        >
          {/* Accent Color Indicator (Top Bar) - Thicker on hover */}
          <div
            className="absolute top-0 left-0 h-1.5 w-full opacity-80 transition-all duration-500 group-hover:h-2 group-hover:opacity-100"
            style={{ backgroundColor: accentColor }}
          />

          {/* Background Decorative Element */}
          <div
            className="absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
            style={{ backgroundColor: accentColor }}
          />

          <CardContent className="flex h-full flex-col p-5 sm:p-6">
            <div className="mb-5 flex flex-col items-start gap-2">
              <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                <h3
                  className="truncate text-xl font-black tracking-tight transition-colors sm:text-2xl"
                  style={{ color: character.accentColor || 'inherit' }}
                >
                  {character.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-muted/80 shrink-0 px-2.5 py-1 text-[10px] font-black tracking-widest uppercase"
                  style={{
                    borderLeft: character.accentColor
                      ? `3px solid ${character.accentColor}`
                      : 'none',
                  }}
                >
                  Nv {character.level}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs font-bold tracking-widest uppercase opacity-60">
                {character.class || 'Aventureiro'}
              </p>
            </div>

            <div className="border-muted/20 mt-auto flex items-center justify-between border-t pt-4">
              <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-50 transition-all group-hover:opacity-100">
                <AppIcon
                  name="Swords"
                  size={14}
                  style={{ color: character.accentColor || 'var(--primary)' }}
                />
                <span>{character.system.replace('_', ' ')}</span>
              </div>

              {/* Desktop-only indicator that card is clickable */}
              <div
                className="hidden h-8 w-8 items-center justify-center rounded-lg border opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 sm:flex"
                style={{
                  backgroundColor: `${accentColor}1A`,
                  borderColor: `${accentColor}33`,
                  color: accentColor,
                }}
              >
                <AppIcon name="ChevronRight" size={18} />
              </div>
            </div>
          </CardContent>

          {/* Hover Glow Effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-5"
            style={{
              background: `radial-gradient(circle at center, ${accentColor}, transparent 70%)`,
            }}
          />
        </Card>
      </Link>

      {/* Delete Action - Floating Button for better mobile accessibility */}
      <div className="absolute -top-2 -right-2 z-10 opacity-0 transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-100 hover:scale-110 sm:top-4 sm:right-4 sm:group-hover:translate-y-0">
        <Button
          destroy
          size="icon"
          title={tCommon('delete')}
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
  );
}
