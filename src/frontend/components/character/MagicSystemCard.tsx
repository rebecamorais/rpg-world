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

export interface MagicSystemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  character: DnD5eCharacter;
  onSystemChange: (system: MagicSystem) => void;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  onSlotsChange: (level: string, max: number, used: number) => void;
}

export const MagicSystemCard = React.forwardRef<HTMLDivElement, MagicSystemCardProps>(
  ({ character, onSystemChange, onPointsChange, onSlotsChange, className, ...props }, ref) => {
    const t = useTranslations('magicSystem');
    const system = character.spellcastingSystem || 'points';

    const systemSelector = (
      <Select value={system} onValueChange={(val) => onSystemChange(val as MagicSystem)}>
        <SelectTrigger className="h-5 w-fit border-none bg-transparent p-0 text-xs font-bold tracking-widest text-zinc-400 uppercase shadow-none focus:ring-0">
          <SelectValue placeholder="Magic" />
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
          ref={ref}
          current={character.spellPoints?.current || 0}
          max={character.spellPoints?.max || 1}
          onPointsChange={onPointsChange}
          systemSelector={systemSelector}
          className={className}
          {...props}
        />
      );
    }

    return (
      <SpellSlots
        ref={ref}
        slots={character.spellSlots || {}}
        onSlotsChange={onSlotsChange}
        systemSelector={systemSelector}
        className={className}
        {...props}
      />
    );
  },
);

MagicSystemCard.displayName = 'MagicSystemCard';
