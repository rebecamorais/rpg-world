'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { MagicSystem, MagicSystemCard } from '@frontend/components/character/MagicSystemCard';
import { HealthPointsCard } from '@frontend/components/character/stats/HealthPointsCard';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardHeader } from '@frontend/components/ui/card';
import { Dialog, DialogTrigger } from '@frontend/components/ui/dialog';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import { CombatStatsDialog } from './CombatStatsDialog';
import { StatBadge } from './StatBadge';

interface CombatStatsSectionProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
  onHitDiceChange: (total: string) => void;
}

interface CombatHeaderProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
  onHitDiceChange: (total: string) => void;
}

const CombatHeader = ({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
  onHitDiceChange,
}: CombatHeaderProps) => {
  const t = useTranslations('combatStats');

  return (
    <CardHeader className="bg-muted/30 border-b border-zinc-800/50 px-3 py-3 md:px-4 md:py-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="grid grid-cols-2 items-center gap-2 md:flex md:flex-row md:gap-4">
          {/* Armor Class */}
          <StatBadge
            icon={
              <AppIcon
                name="shoulder-armor"
                variant="game"
                size="lg"
                className="text-character-flare"
              />
            }
            label={t('armorClass')}
          >
            <GhostInput
              type="number"
              value={character.ac ?? 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onBasicInfoChange('ac', parseInt(e.target.value) || 0)
              }
              className="h-auto w-10 p-0 text-left text-sm font-bold"
            />
          </StatBadge>

          {/* Initiative */}
          <StatBadge
            icon={<AppIcon name="stopwatch" variant="game" size="lg" className="text-orange-500" />}
            label={t('initiative')}
          >
            <GhostInput
              type="number"
              value={character.initiative}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onBasicInfoChange('initiative', parseInt(e.target.value) || 0)
              }
              className="h-auto w-10 p-0 text-left text-sm font-bold"
            />
          </StatBadge>

          {/* Speed */}
          <StatBadge
            icon={
              <AppIcon name="boot-prints" variant="game" size="lg" className="text-emerald-500" />
            }
            label={t('speedUnit')}
            reverse
          >
            <GhostInput
              type="number"
              value={character.speed || 30}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onBasicInfoChange('speed', parseFloat(e.target.value) || 0)
              }
              className="h-auto w-10 p-0 text-left text-sm font-bold"
            />
          </StatBadge>

          {/* Hit Dice */}
          <StatBadge
            icon={<AppIcon name="dice-target" variant="game" size="lg" className="text-sky-400" />}
            label={t('hitDiceShort')}
          >
            <Select
              value={character.hitDice?.total || '1d8'}
              onValueChange={(val) => onHitDiceChange(val)}
            >
              <SelectTrigger className="h-auto border-none bg-transparent p-0 text-sm font-bold shadow-none focus:ring-0 [&>span]:line-clamp-none">
                <SelectValue placeholder="1d8" />
              </SelectTrigger>
              <SelectContent className="min-w-[70px]">
                {['d6', 'd8', 'd10', 'd12'].map((key) => (
                  <SelectItem key={key} value={`1${key}`} className="text-xs font-bold">
                    {t(`diceOptions.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </StatBadge>
        </div>

        <div className="flex justify-end md:shrink-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:border-character-muted/80 hover:bg-character-surface/10 hover:shadow-character-muted/30 h-10 w-10 rounded-full border border-zinc-800/50 bg-zinc-950/40 opacity-70 backdrop-blur-md transition-all duration-300 hover:opacity-100 hover:shadow-[0_0_15px_var(--character-muted)]"
              >
                <AppIcon name="Settings2" size="sm" className="text-character-flare" />
              </Button>
            </DialogTrigger>
            <CombatStatsDialog
              character={character}
              onBasicInfoChange={onBasicInfoChange}
              onSpellcastingSystemChange={onSpellcastingSystemChange}
              onSpellPointsChange={onSpellPointsChange}
              onSpellSlotsChange={onSpellSlotsChange}
            />
          </Dialog>
        </div>
      </div>
    </CardHeader>
  );
};

interface ResourceGridProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
}

const ResourceGrid = ({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
}: ResourceGridProps) => (
  <CardContent className="p-3 md:p-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <HealthPointsCard
        currentHp={character.hpCurrent ?? 0}
        maxHp={character.hpMax || 1}
        tempHp={character.hpTemp ?? 0}
        onHpChange={(field: keyof DnD5eCharacter, value: number) => onBasicInfoChange(field, value)}
      />

      <MagicSystemCard
        character={character}
        onSystemChange={onSpellcastingSystemChange}
        onPointsChange={onSpellPointsChange}
        onSlotsChange={onSpellSlotsChange}
      />
    </div>
  </CardContent>
);

function CombatStatsSection({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
  onHitDiceChange,
}: CombatStatsSectionProps) {
  return (
    <Card className="border-border bg-card">
      <CombatHeader
        character={character}
        onBasicInfoChange={onBasicInfoChange}
        onSpellcastingSystemChange={onSpellcastingSystemChange}
        onSpellPointsChange={onSpellPointsChange}
        onSpellSlotsChange={onSpellSlotsChange}
        onHitDiceChange={onHitDiceChange}
      />
      <ResourceGrid
        character={character}
        onBasicInfoChange={onBasicInfoChange}
        onSpellcastingSystemChange={onSpellcastingSystemChange}
        onSpellPointsChange={onSpellPointsChange}
        onSpellSlotsChange={onSpellSlotsChange}
      />
    </Card>
  );
}

export default React.memo(CombatStatsSection);
