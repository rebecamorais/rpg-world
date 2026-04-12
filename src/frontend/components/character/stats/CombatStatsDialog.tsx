'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { MagicSystem } from '@frontend/components/character/MagicSystemCard';
import { Button } from '@frontend/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { NumberStepper } from '@frontend/components/ui/number-stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

interface CombatStatsDialogProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
}

export const CombatStatsDialog = ({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
}: CombatStatsDialogProps) => {
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const tcommon = useTranslations('common');

  return (
    <DialogContent
      className="character-context border-zinc-800 bg-zinc-950 p-0 shadow-2xl sm:max-w-[700px]"
      style={{ '--character-color': character.accentColor } as React.CSSProperties}
    >
      <DialogHeader className="border-b border-zinc-800 p-6 pb-4">
        <div className="flex items-center gap-2">
          <AppIcon name="Settings2" size="sm" className="text-zinc-400" />
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {tm('titleConfig') || 'Combat Configuration'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {tm('configDescription') || 'Configurar pontos de vida e sistema de magia'}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 divide-zinc-800 md:grid-cols-2 md:divide-x">
        {/* Left Column: HP & Survival */}
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 pb-2">
            <AppIcon name="Heart" size="sm" className="text-red-500" />
            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">
              {t('hitPoints') || 'Hit Points'}
            </h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hpMax" className="text-sm font-bold text-zinc-500 uppercase">
                {t('hitPoints')} Max
              </Label>
              <Input
                id="hpMax"
                type="number"
                value={character.hpMax}
                onChange={(e) => onBasicInfoChange('hpMax', parseInt(e.target.value) || 0)}
                className="h-9 border-zinc-800 bg-zinc-900 transition-colors focus:border-zinc-700"
              />
            </div>

            <NumberStepper
              label={t('tempHp') || 'Temp HP'}
              value={character.hpTemp || 0}
              onChange={(val) => onBasicInfoChange('hpTemp', val)}
              max={2000}
            />
          </div>
        </div>

        {/* Right Column: Magic System */}
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 pb-2">
            <AppIcon name="Sparkles" size="sm" className="text-blue-500" />
            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">
              {tm('systemUsed') || 'Magic System'}
            </h4>
          </div>

          <Tabs
            value={character.spellcastingSystem || 'none'}
            onValueChange={(val) => onSpellcastingSystemChange(val as MagicSystem)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 border border-zinc-800 bg-zinc-900 p-1">
              <TabsTrigger
                value="slots"
                className="h-7 text-sm font-bold uppercase data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                {tm('spellSlots')}
              </TabsTrigger>
              <TabsTrigger
                value="points"
                className="h-7 text-sm font-bold uppercase data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                {tm('spellPoints')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slots" className="mt-4 space-y-1">
              <Label className="mb-2 block text-sm font-bold text-zinc-500 uppercase">
                {tm('slotsCapacity')}
              </Label>
              <div className="flex flex-col gap-1 pr-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                  <NumberStepper
                    key={lvl}
                    label={tm('circle', { level: lvl }) || `${lvl}º Círculo`}
                    value={character.spellSlots?.[lvl.toString()]?.max || 0}
                    onChange={(val) =>
                      onSpellSlotsChange(
                        lvl.toString(),
                        val,
                        character.spellSlots?.[lvl.toString()]?.used || 0,
                      )
                    }
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="points" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-zinc-500 uppercase">
                  {tm('pointsCapacity')}
                </Label>
                <Input
                  type="number"
                  value={character.spellPoints?.max || 0}
                  onChange={(e) => onSpellPointsChange('max', parseInt(e.target.value) || 0)}
                  className="h-9 border-zinc-800 bg-zinc-900 transition-colors focus:border-zinc-700"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter className="border-t border-zinc-800 bg-zinc-900/50 p-6 md:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-9 px-4 text-sm font-bold text-zinc-400 uppercase hover:bg-zinc-800 hover:text-zinc-100"
              >
                {tcommon('cancel') || 'Cancel'}
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="h-9 bg-zinc-100 px-6 text-sm font-bold text-zinc-950 uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-zinc-200">
                {tcommon('save') || 'Save'}
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};
