'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { DamageTheme } from '@frontend/constants/damage-themes';
import { cn } from '@frontend/lib/utils';

import { SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellStatsProps {
  isExpanded: boolean;
  theme: DamageTheme;
  schoolIcon: string;
  mainIcon: string;
  displayValues: SpellDisplayValues;
}

export const SpellStats = React.memo(
  ({ isExpanded, theme, schoolIcon, mainIcon, displayValues }: SpellStatsProps) => (
    <div
      className={cn(
        'flex items-center font-black tracking-widest uppercase transition-all duration-300',
        isExpanded ? 'mt-4 gap-3 text-xs' : 'mt-0 gap-2 text-xs',
        'text-white/70',
      )}
    >
      {isExpanded && (
        <span className={cn('flex items-center gap-1.5', theme.color)}>
          <AppIcon
            variant="game"
            name={schoolIcon}
            size="xs"
            className="opacity-70"
            aria-hidden="true"
          />
          <span className="truncate">
            <span className="sr-only">{displayValues.schoolPrefix}: </span>
            {displayValues.school}
          </span>
        </span>
      )}
      {isExpanded && displayValues.damage && (
        <>
          <span className="opacity-40" aria-hidden="true">
            •
          </span>
          <span className={cn('flex items-center gap-1.5', theme.color)}>
            <AppIcon variant="game" name={mainIcon} size="xs" aria-hidden="true" />
            <span>
              <span className="sr-only">{displayValues.allDamageLabel}: </span>
              {displayValues.damage}
            </span>
          </span>
        </>
      )}
    </div>
  ),
);

SpellStats.displayName = 'SpellStats';
