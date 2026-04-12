'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { DamageTheme, MECHANIC_ICONS } from '@frontend/constants/damage-themes';
import { cn } from '@frontend/lib/utils';
import { Spell } from '@frontend/types/spells';

import { SpellComponentDisplay, SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellHeaderProps {
  spell: Spell;
  isExpanded: boolean;
  theme: DamageTheme;
  mainIcon: string;
  displayValues: SpellDisplayValues;
}

export const SpellHeader = React.memo(
  ({ spell, isExpanded, theme, mainIcon, displayValues }: SpellHeaderProps) => (
    <header
      className={cn('flex flex-col transition-all duration-300', isExpanded ? 'mb-5' : 'mb-0')}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'rounded-xl p-3 shadow-sm ring-1 ring-white/10 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg',
            theme.bg,
            theme.color,
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
                className={cn('truncate font-serif text-xl tracking-tight text-white/90')}
              >
                {spell.name}
              </h3>
              {spell.ritual && (
                <div className="flex shrink-0 items-center space-x-1">
                  <AppIcon
                    variant="game"
                    name={MECHANIC_ICONS.ritual}
                    size="xs"
                    className="shrink-0 text-purple-500"
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
                    <button className="flex items-center justify-center transition-all hover:scale-110 focus:ring-1 focus:ring-[var(--card-glow)] focus:outline-none active:scale-95">
                      <span className="sr-only">{comp.label}</span>
                      <AppIcon
                        variant="game"
                        name={comp.icon}
                        size="xs"
                        className={cn('shrink-0', comp.color)}
                        aria-hidden="true"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="border-white/10 bg-black/90 text-xs font-medium text-white">
                    {comp.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'mt-1 flex items-center justify-between gap-4 text-xs font-black tracking-widest text-white/40 uppercase transition-all duration-300',
              theme.color,
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {isExpanded && (
                <div className="flex items-center gap-1 text-white/60">
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
      </div>
    </header>
  ),
);

SpellHeader.displayName = 'SpellHeader';
