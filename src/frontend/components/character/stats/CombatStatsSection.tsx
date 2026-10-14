'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { MagicSystemCard } from '@frontend/components/character/MagicSystemCard';
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
import { StatBlock } from '@frontend/components/ui/stat-block';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setHitDice, setSpellPoints, setSpellSlots } from '@frontend/lib/character-sheet-updates';

import { CombatStatsDialog } from './CombatStatsDialog';

const STAT_INPUT = 'h-6 w-12 p-0 font-mono text-base font-bold focus-visible:px-1 md:text-base';

const toInt = (e: React.ChangeEvent<HTMLInputElement>) => parseInt(e.target.value) || 0;

const CombatHeader = () => {
  const t = useTranslations('combatStats');
  const character = useLoadedCharacter();
  const { update } = useCharacterActions();

  return (
    <CardHeader className="border-border bg-muted/30 border-b px-4 py-4 md:px-6 md:py-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:flex-wrap md:gap-3">
          <StatBlock icon="shoulder-armor" label={t('armorClass')}>
            <GhostInput
              type="number"
              aria-label={t('armorClass')}
              value={character.ac ?? 0}
              onChange={(e) => update({ ac: toInt(e) })}
              showIcon={false}
              className={STAT_INPUT}
            />
          </StatBlock>

          <StatBlock icon="stopwatch" label={t('initiative')}>
            <GhostInput
              type="number"
              aria-label={t('initiative')}
              value={character.initiative}
              onChange={(e) => update({ initiative: toInt(e) })}
              showIcon={false}
              className={STAT_INPUT}
            />
          </StatBlock>

          <StatBlock icon="boot-prints" label={t('speed')} unit={t('speedUnit')}>
            <GhostInput
              type="number"
              aria-label={t('speed')}
              value={character.speed || 30}
              onChange={(e) => update({ speed: parseFloat(e.target.value) || 0 })}
              showIcon={false}
              className={STAT_INPUT}
            />
          </StatBlock>

          <StatBlock icon="dice-target" label={t('hitDiceShort')}>
            <Select
              value={character.hitDice?.total || '1d8'}
              onValueChange={(val) => update(setHitDice(val))}
            >
              <SelectTrigger
                aria-label={t('hitDice')}
                className="h-6 gap-1 border-none bg-transparent p-0 font-mono text-base font-bold shadow-none backdrop-blur-none hover:bg-transparent [&>span]:line-clamp-none"
              >
                <SelectValue placeholder="1d8" />
              </SelectTrigger>
              <SelectContent className="min-w-[80px]">
                {['d6', 'd8', 'd10', 'd12'].map((key) => (
                  <SelectItem key={key} value={`1${key}`} className="font-mono">
                    {t(`diceOptions.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </StatBlock>
        </div>

        <div className="flex justify-end md:shrink-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('edit')}
                className="border-border bg-background/60 hover:border-character-muted hover:bg-character-surface h-10 w-10 rounded-xl border"
              >
                <AppIcon name="Settings2" size="sm" className="text-character-flare" />
              </Button>
            </DialogTrigger>
            <CombatStatsDialog />
          </Dialog>
        </div>
      </div>
    </CardHeader>
  );
};

const ResourceGrid = () => {
  const character = useLoadedCharacter();
  const { update } = useCharacterActions();

  return (
    <CardContent className="p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <HealthPointsCard
          currentHp={character.hpCurrent ?? 0}
          maxHp={character.hpMax || 1}
          tempHp={character.hpTemp ?? 0}
          onHpChange={(field, value) => update({ [field]: value })}
        />

        <MagicSystemCard
          character={character}
          onSystemChange={(system) => update({ spellcastingSystem: system })}
          onPointsChange={(field, value) => update(setSpellPoints(field, value))}
          onSlotsChange={(level, max, used) => update(setSpellSlots(level, max, used))}
        />
      </div>
    </CardContent>
  );
};

export default function CombatStatsSection() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CombatHeader />
      <ResourceGrid />
    </Card>
  );
}
