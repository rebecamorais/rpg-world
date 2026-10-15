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
import { LearnSpellAction, PrepareSpellAction } from './parts/SpellQuickAction';

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

  const quickAction = onLearnSpell ? (
    <LearnSpellAction
      isLearned={!!isLearned}
      learnLabel={displayValues.learnLabel}
      forgetLabel={displayValues.forgetLabel}
      onLearn={() => onLearnSpell(spell.id)}
      onForget={() => onForgetSpell?.(spell.id)}
    />
  ) : onTogglePrepared && spell.level > 0 ? (
    <PrepareSpellAction
      isPrepared={!!spell.isPrepared}
      prepareLabel={displayValues.prepareLabel}
      unprepareLabel={displayValues.unprepareLabel}
      onToggle={() => onTogglePrepared(spell.id, !spell.isPrepared)}
    />
  ) : null;

  const cardStyles = useMemo(
    () =>
      ({
        '--spell-color': theme.hex,
        contentVisibility: 'auto',
      }) as React.CSSProperties,
    [theme.hex],
  );

  return (
    <article
      className={cn(
        'spell-context group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 ease-out outline-none',
        'bg-card/40 hover:border-spell backdrop-blur-md hover:backdrop-blur-xl',
        isExpanded
          ? 'bg-card/60 border-spell shadow-lg'
          : 'border-spell-muted hover:bg-card/50 hover:-translate-y-1',
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
        className="focus-visible:outline-spell-flare absolute inset-0 z-0 h-full w-full rounded-2xl bg-transparent outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
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
          mainIcon={mainIcon}
          displayValues={displayValues}
          isLearned={isLearned}
          action={quickAction}
        />

        {/* Expandable Content with Grid Transition */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          {/* inert while collapsed: hidden content can't take focus or be read. */}
          <div className="overflow-hidden" inert={!isExpanded}>
            <div className="flex flex-col gap-4">
              <SpellDetails spell={spell} isExpanded={isExpanded} />

              <div className="mt-auto">
                <SpellChipsRow spell={spell} displayValues={displayValues} />
              </div>

              {!onLearnSpell && (
                <div className="pointer-events-auto">
                  <SpellActions
                    spell={spell}
                    onForgetSpell={onForgetSpell}
                    displayValues={displayValues}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const SpellVFX = React.memo(({ mainIcon, spell }: { mainIcon: string; spell: Spell }) => (
  <div aria-hidden="true">
    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--spell-muted),transparent_70%)] opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
    <SpellBackground spell={spell} />
    <div className="motion-safe:group-hover:animate-shimmer via-foreground/5 pointer-events-none absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent" />
    <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 opacity-5 transition-all duration-700 ease-in-out group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-15">
      <AppIcon variant="game" name={mainIcon} size={160} strokeWidth={1} />
    </div>
  </div>
));
SpellVFX.displayName = 'SpellVFX';
