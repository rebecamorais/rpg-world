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
import { characterTheme } from '@frontend/lib/color-utils';

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
      className="character-context border-border bg-background p-0 shadow-2xl sm:max-w-[700px]"
      style={characterTheme(character.accentColor).style}
    >
      <DialogHeader className="border-border border-b p-6 pb-4">
        <div className="flex items-center gap-2">
          <AppIcon name="Settings2" size="sm" className="text-muted-foreground" />
          <DialogTitle>{tm('titleConfig') || 'Combat Configuration'}</DialogTitle>
          <DialogDescription className="sr-only">
            {tm('configDescription') || 'Configurar pontos de vida e sistema de magia'}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="divide-border grid grid-cols-1 md:grid-cols-2 md:divide-x">
        {/* Left Column: HP & Survival */}
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 pb-2">
            <AppIcon name="Heart" size="sm" className="text-danger-flare" />
            <h4 className="text-label text-muted-foreground">{t('hitPoints') || 'Hit Points'}</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hpMax" className="text-muted-foreground text-sm font-bold uppercase">
                {t('hitPoints')} Max
              </Label>
              <Input
                id="hpMax"
                type="number"
                value={character.hpMax}
                onChange={(e) => onBasicInfoChange('hpMax', parseInt(e.target.value) || 0)}
                className="border-border bg-muted focus:border-border h-9 transition-colors"
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
            <AppIcon name="Sparkles" size="sm" className="text-info-flare" />
            <h4 className="text-label text-muted-foreground">
              {tm('systemUsed') || 'Magic System'}
            </h4>
          </div>

          <Tabs
            value={character.spellcastingSystem || 'none'}
            onValueChange={(val) => onSpellcastingSystemChange(val as MagicSystem)}
            className="w-full"
          >
            <TabsList className="border-border bg-muted grid w-full grid-cols-2 border p-1">
              <TabsTrigger
                value="slots"
                className="data-[state=active]:bg-muted data-[state=active]:text-foreground h-7 text-sm font-bold uppercase"
              >
                {tm('spellSlots')}
              </TabsTrigger>
              <TabsTrigger
                value="points"
                className="data-[state=active]:bg-muted data-[state=active]:text-foreground h-7 text-sm font-bold uppercase"
              >
                {tm('spellPoints')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slots" className="mt-4 space-y-1">
              <Label className="text-muted-foreground mb-2 block text-sm font-bold uppercase">
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
                <Label className="text-muted-foreground text-sm font-bold uppercase">
                  {tm('pointsCapacity')}
                </Label>
                <Input
                  type="number"
                  value={character.spellPoints?.max || 0}
                  onChange={(e) => onSpellPointsChange('max', parseInt(e.target.value) || 0)}
                  className="border-border bg-muted focus:border-border h-9 transition-colors"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter className="border-border bg-muted/50 border-t p-6 md:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:bg-muted hover:text-foreground h-9 px-4 text-sm font-bold uppercase"
              >
                {tcommon('cancel')}
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="character" className="h-9 px-6 text-sm font-bold uppercase">
                {tcommon('save')}
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};
