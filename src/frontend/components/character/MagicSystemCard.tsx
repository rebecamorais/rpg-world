import * as React from 'react';

import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import { SpellPoints } from './magic-system/SpellPoints';
import { SpellSlots } from './magic-system/SpellSlots';

export type MagicSystem = 'slots' | 'points';

export interface MagicSystemCardProps extends React.ComponentProps<'div'> {
  character: DnD5eCharacter;
  onSystemChange: (system: MagicSystem) => void;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  onSlotsChange: (level: string, max: number, used: number) => void;
  /** Shown in the top-right corner, e.g. the settings button. */
  action?: React.ReactNode;
}

export function MagicSystemCard({
  character,
  onSystemChange,
  onPointsChange,
  onSlotsChange,
  action,
  className,
  ...props
}: MagicSystemCardProps) {
  const t = useTranslations('magicSystem');
  const system = character.spellcastingSystem || 'points';

  const systemSelector = (
    <Select value={system} onValueChange={(val) => onSystemChange(val as MagicSystem)}>
      <SelectTrigger
        aria-label={t('systemUsed')}
        className="text-muted-foreground text-label h-5 w-fit border-none bg-transparent p-0 shadow-none"
      >
        <SelectValue placeholder={t('systemPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="slots" className="text-sm">
          {t('spellSlots')}
        </SelectItem>
        <SelectItem value="points" className="text-sm">
          {t('spellPoints')}
        </SelectItem>
      </SelectContent>
    </Select>
  );

  if (system === 'points') {
    return (
      <SpellPoints
        current={character.spellPoints?.current || 0}
        max={character.spellPoints?.max || 1}
        onPointsChange={onPointsChange}
        systemSelector={systemSelector}
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
      systemSelector={systemSelector}
      action={action}
      className={className}
      {...props}
    />
  );
}
