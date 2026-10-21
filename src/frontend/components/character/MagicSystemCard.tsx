import * as React from 'react';

import { useTranslations } from 'next-intl';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import { SpellPoints } from './magic-system/SpellPoints';
import { SpellSlots } from './magic-system/SpellSlots';

export type MagicSystem = 'slots' | 'points';

export interface MagicSystemCardProps extends React.ComponentProps<'div'> {
  character: DnD5eCharacter;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  onSlotsChange: (level: string, max: number, used: number) => void;
  /** Shown in the top-right corner, e.g. the settings button. */
  action?: React.ReactNode;
}

export function MagicSystemCard({
  character,
  onPointsChange,
  onSlotsChange,
  action,
  className,
  ...props
}: MagicSystemCardProps) {
  const t = useTranslations('magicSystem');
  const system = character.spellcastingSystem || 'points';

  // The system is changed in the card's settings (the gear), so here it is just the title
  const systemLabel = (
    <span className="text-label text-muted-foreground">
      {system === 'slots' ? t('spellSlots') : t('spellPoints')}
    </span>
  );

  if (system === 'points') {
    return (
      <SpellPoints
        current={character.spellPoints?.current || 0}
        max={character.spellPoints?.max || 1}
        onPointsChange={onPointsChange}
        systemLabel={systemLabel}
        action={action}
        className={className}
        {...props}
      />
    );
  }

  return (
    <SpellSlots
      slots={character.spellSlots || {}}
      onSlotsChange={onSlotsChange}
      systemLabel={systemLabel}
      action={action}
      className={className}
      {...props}
    />
  );
}
