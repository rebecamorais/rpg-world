'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { MECHANIC_ICONS } from '@frontend/constants/damage-themes';
import { cn } from '@frontend/lib/utils';
import { Spell } from '@frontend/types/spells';

import { SpellComponentDisplay, SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellHeaderProps {
  spell: Spell;
  isExpanded: boolean;
  mainIcon: string;
  displayValues: SpellDisplayValues;
  /** Shows the "learned" badge (spell search). */
  isLearned?: boolean;
  /** Shows the level; off where the cards are already grouped by level (spellbook). */
  showLevel?: boolean;
  /** Quick action at the end of the header, visible even when the card is collapsed. */
  action?: React.ReactNode;
}

/** One item of the details line; the line puts a separator between items. */
function Detail({
  icon,
  className,
  children,
}: {
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li className={cn('flex items-center gap-1', className)}>
      {icon}
      {children}
    </li>
  );
}

// `'•' / ''`: a visual separator with empty alt text, so screen readers don't say "bullet"
const SEPARATOR =
  "[&>li+li]:before:text-muted-foreground/40 [&>li+li]:before:mr-1 [&>li+li]:before:content-['•'_/_'']";

export const SpellHeader = React.memo(
  ({
    spell,
    isExpanded,
    mainIcon,
    displayValues,
    isLearned,
    showLevel,
    action,
  }: SpellHeaderProps) => (
    <header className="flex items-center gap-4">
      <div
        className="bg-spell-surface text-spell-flare ring-spell-muted shrink-0 rounded-lg p-2.5 ring-1"
        aria-hidden="true"
      >
        <AppIcon variant="game" name={mainIcon} size="lg" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h3
              id={`spell-name-${spell.id}`}
              className="text-foreground font-display truncate text-lg font-semibold"
            >
              {spell.name}
            </h3>
            {spell.ritual && (
              <div className="flex shrink-0 items-center space-x-1">
                <AppIcon
                  variant="game"
                  name={MECHANIC_ICONS.ritual}
                  size="xs"
                  className="text-info-flare shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{displayValues.ritualLabel}</span>
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-1">
            {displayValues.components.map((comp: SpellComponentDisplay) => (
              <Tooltip key={comp.letter}>
                <TooltipTrigger asChild>
                  {/* Not focusable: the label is already in the text for screen readers. */}
                  <span className="flex size-6 items-center justify-center">
                    <span className="sr-only">{comp.label}</span>
                    <AppIcon
                      variant="game"
                      name={comp.icon}
                      size="xs"
                      className={cn('shrink-0', comp.color)}
                      aria-hidden="true"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-foreground font-semibold">{comp.label}</p>
                  {comp.hint && <p className="text-muted-foreground">{comp.hint}</p>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="text-label text-muted-foreground mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {/* Open, the chips below carry casting time, range and duration: the header says
              what the spell is (level, school, damage) instead of repeating them */}
          <ul className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1', SEPARATOR)}>
            {isLearned && (
              <Detail
                className="text-success-flare"
                icon={<AppIcon name="Check" size="xs" aria-hidden="true" />}
              >
                {/* On phones the check button already shows it; keep the text for screen readers */}
                <span className="max-sm:sr-only">{displayValues.learnedBadgeLabel}</span>
              </Detail>
            )}

            {showLevel && <Detail className="text-foreground">{displayValues.level}</Detail>}

            {isExpanded ? (
              <Detail>{displayValues.school}</Detail>
            ) : (
              <Detail
                icon={
                  <AppIcon
                    variant="game"
                    name={MECHANIC_ICONS.castingTime}
                    size="xs"
                    className="opacity-60"
                    aria-hidden="true"
                  />
                }
              >
                <span className="truncate">
                  <span className="sr-only">{displayValues.castingTimePrefix}: </span>
                  {displayValues.compactCastingTime}
                </span>
              </Detail>
            )}

            {displayValues.edition && (
              <Detail>
                <span className="sr-only">{displayValues.editionPrefix}: </span>
                {displayValues.edition}
              </Detail>
            )}

            {displayValues.damage && (
              <Detail
                className="text-spell-flare"
                icon={<AppIcon variant="game" name={mainIcon} size="xs" aria-hidden="true" />}
              >
                <span className="sr-only">{displayValues.allDamageLabel}: </span>
                {displayValues.damage}
              </Detail>
            )}
          </ul>

          {!isExpanded && (
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-1">
                <AppIcon name="Crosshair" size="xs" className="opacity-60" aria-hidden="true" />
                <span>
                  <span className="sr-only">{displayValues.rangePrefix}: </span>
                  {displayValues.range}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <AppIcon
                  variant="game"
                  name={MECHANIC_ICONS.duration}
                  size="xs"
                  className="opacity-60"
                  aria-hidden="true"
                />
                <span>
                  <span className="sr-only">{displayValues.durationPrefix}: </span>
                  {displayValues.duration}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {action && <div className="pointer-events-auto shrink-0">{action}</div>}
    </header>
  ),
);

SpellHeader.displayName = 'SpellHeader';
