'use client';

import React, { useMemo } from 'react';

import type { CardMaterial } from '@frontend/components/grimoire/material-surface/types';
import { AppIcon } from '@frontend/components/ui/icon';
import { useIsSpellPending } from '@frontend/hooks/useCharacterSpells';
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
  /** Whose spellbook the card belongs to, so it only waits on that character's writes. */
  characterId?: string;
  isExpanded?: boolean;
  /** Called with the spell's id; a stable function lets the card skip re-rendering. */
  onToggle?: (id: string) => void;
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  onLearnSpell?: (id: string) => void;
  isLearned?: boolean;
  showLevel?: boolean;
  /**
   * Grimoire exploration (/dev/grimoire/materials only): a material surface for the card.
   * Without it the card renders exactly as before. Pass a stable object so the memo holds.
   */
  material?: CardMaterial;
}

export const SpellCard = React.memo(function SpellCard({
  spell,
  characterId,
  isExpanded = false,
  onToggle,
  onForgetSpell,
  onTogglePrepared,
  onLearnSpell,
  isLearned,
  showLevel,
  material,
}: SpellCardProps) {
  const { theme, mainIcon, displayValues } = useSpellDisplay(spell);
  // This spell's own write, not the whole list's: the other cards stay usable meanwhile
  const pending = useIsSpellPending(spell.id, characterId);

  const quickAction = onLearnSpell ? (
    <LearnSpellAction
      isLearned={!!isLearned}
      learnLabel={displayValues.learnLabel}
      forgetLabel={displayValues.forgetLabel}
      pending={pending}
      onLearn={() => onLearnSpell(spell.id)}
      onForget={() => onForgetSpell?.(spell.id)}
    />
  ) : onTogglePrepared && spell.level > 0 ? (
    <PrepareSpellAction
      isPrepared={!!spell.isPrepared}
      prepareLabel={displayValues.prepareLabel}
      unprepareLabel={displayValues.unprepareLabel}
      pending={pending}
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

  // The spell's color lives in this stripe, the icon and the badges; the surface stays plain
  const stripe = <span aria-hidden="true" className="bg-spell absolute inset-y-0 left-0 w-1" />;

  return (
    <article
      className={cn(
        'spell-context group bg-card relative overflow-hidden rounded-xl border p-4 pl-5 outline-none sm:p-5 sm:pl-6',
        'transition-[border-color] duration-200',
        isExpanded ? 'border-spell-muted' : 'border-border hover:border-spell-muted',
        // With a material the outer box stops clipping (room for ornaments past the edge);
        // the inner layer below keeps the rounded clip for what is painted inside
        material && 'overflow-visible',
      )}
      style={cardStyles}
      aria-labelledby={`spell-name-${spell.id}`}
    >
      {material ? (
        <span
          aria-hidden="true"
          data-material-clip=""
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[calc(var(--radius-xl)-1px)]"
        >
          {material.surface}
          {stripe}
          {isExpanded && <SpellVFX mainIcon={mainIcon} spell={spell} />}
        </span>
      ) : (
        stripe
      )}

      {/* Primary Toggle Action (Clickable Background) */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`spell-details-${spell.id}`}
        onClick={() => onToggle?.(spell.id)}
        className="focus-visible:outline-spell-flare absolute inset-0 z-0 h-full w-full rounded-xl bg-transparent outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="sr-only">
          {isExpanded ? displayValues.collapseLabel : displayValues.expandLabel} {spell.name}
        </span>
      </button>

      {!material && isExpanded && <SpellVFX mainIcon={mainIcon} spell={spell} />}

      {material?.ornament}

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
              <SpellDetails spell={spell} castingTime={displayValues.castingTime} />

              <SpellChipsRow spell={spell} displayValues={displayValues} />

              {!onLearnSpell && onForgetSpell && (
                <div className="pointer-events-auto">
                  <SpellActions
                    spell={spell}
                    onForgetSpell={onForgetSpell}
                    pending={pending}
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
});

/**
 * Thematic background, only on the open card and faded out before the description, so the
 * rules text sits on a plain surface.
 */
const SpellVFX = React.memo(({ mainIcon, spell }: { mainIcon: string; spell: Spell }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,black,transparent_45%)] opacity-50"
  >
    <SpellBackground spell={spell} />
    <div className="absolute -top-6 -right-6 opacity-10">
      <AppIcon variant="game" name={mainIcon} size={128} strokeWidth={1} />
    </div>
  </div>
));
SpellVFX.displayName = 'SpellVFX';
