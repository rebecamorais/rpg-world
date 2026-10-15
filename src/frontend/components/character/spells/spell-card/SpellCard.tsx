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
  showLevel?: boolean;
}

export function SpellCard({
  spell,
  isExpanded = false,
  onClick,
  onForgetSpell,
  onTogglePrepared,
  onLearnSpell,
  isLearned,
  showLevel,
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
        // Height of a collapsed card, so off-screen cards don't make the scrollbar jump
        containIntrinsicSize: 'auto 96px',
      }) as React.CSSProperties,
    [theme.hex],
  );

  return (
    <article
      className={cn(
        'spell-context group bg-card relative overflow-hidden rounded-xl border p-4 pl-5 outline-none sm:p-5 sm:pl-6',
        'transition-[border-color] duration-200',
        isExpanded ? 'border-spell-muted' : 'border-border hover:border-spell-muted',
      )}
      style={cardStyles}
      aria-labelledby={`spell-name-${spell.id}`}
    >
      {/* The spell's color lives in this stripe, the icon and the badges; the surface stays plain */}
      <span aria-hidden="true" className="bg-spell absolute inset-y-0 left-0 w-1" />

      {/* Primary Toggle Action (Clickable Background) */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`spell-details-${spell.id}`}
        onClick={onClick}
        className="focus-visible:outline-spell-flare absolute inset-0 z-0 h-full w-full rounded-xl bg-transparent outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="sr-only">
          {isExpanded ? displayValues.collapseLabel : displayValues.expandLabel} {spell.name}
        </span>
      </button>

      {isExpanded && <SpellVFX mainIcon={mainIcon} spell={spell} vfx={theme.vfx} />}

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <SpellHeader
          spell={spell}
          isExpanded={isExpanded}
          mainIcon={mainIcon}
          displayValues={displayValues}
          isLearned={isLearned}
          showLevel={showLevel}
          action={quickAction}
        />

        {/* Expandable Content with Grid Transition */}
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          {/* inert while collapsed: hidden content can't take focus or be read. */}
          <div className="overflow-hidden" inert={!isExpanded}>
            <div className="flex flex-col gap-4 pt-4">
              <SpellDetails spell={spell} />

              <SpellChipsRow spell={spell} displayValues={displayValues} />

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

/**
 * Thematic background, only on the open card and faded out before the description, so the
 * rules text sits on a plain surface.
 */
const SpellVFX = React.memo(
  ({ mainIcon, spell, vfx }: { mainIcon: string; spell: Spell; vfx: string }) => (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,black,transparent_45%)] opacity-50"
    >
      <SpellBackground spell={spell} themeVfx={vfx} />
      <div className="absolute -top-6 -right-6 opacity-10">
        <AppIcon variant="game" name={mainIcon} size={128} strokeWidth={1} />
      </div>
    </div>
  ),
);
SpellVFX.displayName = 'SpellVFX';
