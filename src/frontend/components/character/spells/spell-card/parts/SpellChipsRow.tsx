'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { MECHANIC_ICONS } from '@frontend/constants/damage-themes';
import { Spell } from '@frontend/types/spells';

import { SpellChip } from '../SpellChip';
import { SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellChipsRowProps {
  spell: Spell;
  displayValues: SpellDisplayValues;
}

export const SpellChipsRow = React.memo(({ spell, displayValues }: SpellChipsRowProps) => (
  <div className="pointer-events-auto flex flex-wrap gap-1 border-t border-white/5 pt-6">
    {(spell.castingTime || spell.castingValue) && (
      <SpellChip
        icon={
          <AppIcon variant="game" name={MECHANIC_ICONS.castingTime} size="xs" aria-hidden="true" />
        }
        tooltip={displayValues.castingTimePrefix}
      >
        <span className="sr-only">{displayValues.castingTimePrefix}: </span>
        {displayValues.castingTime}
      </SpellChip>
    )}
    {(spell.rangeUnit || spell.rangeValue !== undefined) && (
      <SpellChip
        icon={<AppIcon name="Crosshair" size="xs" aria-hidden="true" />}
        tooltip={displayValues.rangePrefix}
      >
        <span className="sr-only">{displayValues.rangePrefix}: </span>
        {displayValues.range}
      </SpellChip>
    )}
    {(spell.durationUnit || spell.durationValue !== undefined) && (
      <SpellChip
        icon={
          <AppIcon variant="game" name={MECHANIC_ICONS.duration} size="xs" aria-hidden="true" />
        }
        tooltip={displayValues.durationPrefix}
      >
        <span className="sr-only">{displayValues.durationPrefix}: </span>
        {displayValues.duration}
      </SpellChip>
    )}
    {spell.concentration && (
      <SpellChip
        variant="concentration"
        tooltip={displayValues.concentrationLabel}
        icon={
          <AppIcon
            variant="game"
            name={MECHANIC_ICONS.concentration}
            size="xs"
            aria-hidden="true"
          />
        }
      >
        {displayValues.concentrationLabel}
      </SpellChip>
    )}
    {spell.ritual && (
      <SpellChip
        variant="ritual"
        tooltip={displayValues.ritualLabel}
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.ritual} size="xs" aria-hidden="true" />}
      >
        {displayValues.ritualLabel}
      </SpellChip>
    )}
  </div>
));

SpellChipsRow.displayName = 'SpellChipsRow';
