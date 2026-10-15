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
  /** Quick action at the end of the header, visible even when the card is collapsed. */
  action?: React.ReactNode;
}

export const SpellHeader = React.memo(
  ({ spell, isExpanded, mainIcon, displayValues, isLearned, action }: SpellHeaderProps) => (
    <header
      className={cn('flex flex-col transition-all duration-300', isExpanded ? 'mb-5' : 'mb-0')}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'bg-spell-surface text-spell-flare ring-border rounded-xl p-3 shadow-sm ring-1 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg',
          )}
          aria-hidden="true"
        >
          <AppIcon variant="game" name={mainIcon} size="lg" />
        </div>

        <div className="flex flex-1 flex-col justify-center overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <h3
                id={`spell-name-${spell.id}`}
                className={cn('text-foreground truncate font-serif text-xl tracking-tight')}
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
                  <TooltipContent className="text-xs font-medium">{comp.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'text-label text-muted-foreground mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 transition-all duration-300 md:gap-x-4',
              'text-spell-flare',
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {isLearned && (
                <div className="text-success-flare flex items-center gap-1">
                  <AppIcon name="Check" size="xs" aria-hidden="true" />
                  {/* On phones the check button already shows it; keep the text for screen readers */}
                  <span className="max-sm:sr-only">{displayValues.learnedBadgeLabel}</span>
                  <span className="text-muted-foreground opacity-40" aria-hidden="true">
                    •
                  </span>
                </div>
              )}

              {isExpanded && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <span>{displayValues.school}</span>
                  <span className="opacity-40" aria-hidden="true">
                    •
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <AppIcon
                  variant="game"
                  name={MECHANIC_ICONS.castingTime}
                  size="xs"
                  className="opacity-50"
                  aria-hidden="true"
                />
                <span className="truncate">
                  <span className="sr-only">{displayValues.castingTimePrefix}: </span>
                  {displayValues.compactCastingTime}
                </span>
              </div>

              {displayValues.damage && (
                <div className="flex items-center gap-2">
                  <span className="opacity-40" aria-hidden="true">
                    •
                  </span>
                  <div className="flex items-center gap-1">
                    <AppIcon
                      variant="game"
                      name={mainIcon}
                      size="xs"
                      className="opacity-50"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="sr-only">{displayValues.allDamageLabel}: </span>
                      {displayValues.damage}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isExpanded && (
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-1">
                  <AppIcon name="Crosshair" size="xs" className="opacity-50" aria-hidden="true" />
                  <span>{displayValues.range}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AppIcon
                    variant="game"
                    name={MECHANIC_ICONS.duration}
                    size="xs"
                    className="opacity-50"
                    aria-hidden="true"
                  />
                  <span>{displayValues.duration}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {action && <div className="pointer-events-auto shrink-0">{action}</div>}
      </div>
    </header>
  ),
);

SpellHeader.displayName = 'SpellHeader';
