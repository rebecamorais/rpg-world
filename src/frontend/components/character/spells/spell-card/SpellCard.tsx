'use client';

import React, { useMemo } from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';
import type { Spell } from '@frontend/types/spells';

import { SpellBackground } from './SpellBackground';
import { useSpellDisplay } from './hooks/useSpellDisplay';
import { SpellActions } from './parts/SpellActions';
import { SpellChipsRow } from './parts/SpellChipsRow';
import { SpellDetails } from './parts/SpellDetails';
import { SpellHeader } from './parts/SpellHeader';

interface SpellCardProps {
  spell: Spell;
  isExpanded?: boolean;
  onClick?: () => void;
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  onLearnSpell?: (id: string) => void;
  isLearned?: boolean;
}

export function SpellCard({
  spell,
  isExpanded = false,
  onClick,
  onForgetSpell,
  onTogglePrepared,
  onLearnSpell,
  isLearned,
}: SpellCardProps) {
  const { theme, mainIcon, displayValues } = useSpellDisplay(spell);

  const cardStyles = useMemo(
    () =>
      ({
        '--theme-primary': theme.hex,
        '--card-glow': theme.hex,
        '--card-muted': `color-mix(in srgb, ${theme.hex}, transparent 70%)`,
        contentVisibility: 'auto',
      }) as React.CSSProperties,
    [theme.hex],
  );

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 ease-out outline-none',
        'bg-card/40 backdrop-blur-md hover:border-[var(--card-glow)] hover:backdrop-blur-xl',
        isExpanded
          ? 'bg-card/60 border-[var(--card-glow)] shadow-lg'
          : 'hover:bg-card/50 hover:-translate-y-1',
        !isExpanded && theme.border,
      )}
      style={cardStyles}
      aria-labelledby={`spell-name-${spell.id}`}
    >
      {/* Primary Toggle Action (Clickable Background) */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`spell-details-${spell.id}`}
        onClick={onClick}
        className="absolute inset-0 z-0 h-full w-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--card-glow)] focus-visible:ring-offset-2"
      >
        <span className="sr-only">
          {isExpanded ? displayValues.collapseLabel : displayValues.expandLabel} {spell.name}
        </span>
      </button>

      <SpellVFX mainIcon={mainIcon} spell={spell} />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <SpellHeader
          spell={spell}
          isExpanded={isExpanded}
          theme={theme}
          mainIcon={mainIcon}
          displayValues={displayValues}
        />

        {/* Expandable Content with Grid Transition */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4">
              <SpellDetails spell={spell} isExpanded={isExpanded} />

              <div className="mt-auto">
                <SpellChipsRow spell={spell} displayValues={displayValues} />
              </div>

              <div className="pointer-events-auto">
                <SpellActions
                  spell={spell}
                  onForgetSpell={onForgetSpell}
                  onTogglePrepared={onTogglePrepared}
                  onLearnSpell={onLearnSpell}
                  isLearned={isLearned}
                  displayValues={displayValues}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const SpellVFX = React.memo(({ mainIcon, spell }: { mainIcon: string; spell: Spell }) => (
  <div aria-hidden="true">
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100"
      style={{
        background: `radial-gradient(circle at center, var(--card-muted), transparent 70%)`,
      }}
    />
    <SpellBackground spell={spell} />
    <div className="group-hover:animate-shimmer pointer-events-none absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 opacity-5 transition-all duration-700 ease-in-out group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-15">
      <AppIcon variant="game" name={mainIcon} size={160} strokeWidth={1} />
    </div>
  </div>
));
SpellVFX.displayName = 'SpellVFX';
