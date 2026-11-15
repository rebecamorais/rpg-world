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

// A chip never wider than the card: at 320px "INSTANTÂNEA" ran past the edge and was cut. Its text
// wraps instead, breaking a word only when that word alone doesn't fit
const CHIP = 'min-w-0 max-w-full';
const ChipText = ({ children }: { children: React.ReactNode }) => (
  <span className="min-w-0 break-words">{children}</span>
);

export const SpellChipsRow = React.memo(({ spell, displayValues }: SpellChipsRowProps) => (
  <div className="pointer-events-auto flex min-w-0 flex-wrap gap-1">
    {(spell.castingTime || spell.castingValue) && (
      <SpellChip
        className={CHIP}
        icon={
          <AppIcon variant="game" name={MECHANIC_ICONS.castingTime} size="xs" aria-hidden="true" />
        }
        tooltip={displayValues.castingTimePrefix}
      >
        <ChipText>
          <span className="sr-only">{displayValues.castingTimePrefix}: </span>
          {displayValues.castingTime}
        </ChipText>
      </SpellChip>
    )}
    {(spell.rangeUnit || spell.rangeValue !== undefined) && (
      <SpellChip
        className={CHIP}
        icon={<AppIcon name="Crosshair" size="xs" aria-hidden="true" />}
        tooltip={displayValues.rangePrefix}
      >
        <ChipText>
          <span className="sr-only">{displayValues.rangePrefix}: </span>
          {displayValues.range}
        </ChipText>
      </SpellChip>
    )}
    {(spell.durationUnit || spell.durationValue !== undefined) && (
      <SpellChip
        className={CHIP}
        icon={
          <AppIcon variant="game" name={MECHANIC_ICONS.duration} size="xs" aria-hidden="true" />
        }
        tooltip={displayValues.durationPrefix}
      >
        <ChipText>
          <span className="sr-only">{displayValues.durationPrefix}: </span>
          {displayValues.duration}
        </ChipText>
      </SpellChip>
    )}
    {spell.concentration && (
      <SpellChip
        className={CHIP}
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
        <ChipText>{displayValues.concentrationLabel}</ChipText>
      </SpellChip>
    )}
    {spell.ritual && (
      <SpellChip
        className={CHIP}
        variant="ritual"
        tooltip={displayValues.ritualLabel}
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.ritual} size="xs" aria-hidden="true" />}
      >
        <ChipText>{displayValues.ritualLabel}</ChipText>
      </SpellChip>
    )}
  </div>
));

SpellChipsRow.displayName = 'SpellChipsRow';
