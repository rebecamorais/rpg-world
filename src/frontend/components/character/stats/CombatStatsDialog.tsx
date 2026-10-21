'use client';

import { useState } from 'react';

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
import { Label } from '@frontend/components/ui/label';
import { NumberInput } from '@frontend/components/ui/number-input';
import { NumberStepper } from '@frontend/components/ui/number-stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { characterTheme } from '@frontend/lib/color-utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

type CombatConfig = Pick<
  DnD5eCharacter,
  'hpMax' | 'hpTemp' | 'spellcastingSystem' | 'spellSlots' | 'spellPoints'
>;

export type CombatConfigSection = 'hp' | 'magic';

const CONFIG_FIELDS = {
  hp: ['hpMax', 'hpTemp'],
  magic: ['spellcastingSystem', 'spellSlots', 'spellPoints'],
} as const satisfies Record<CombatConfigSection, readonly (keyof CombatConfig)[]>;

/**
 * Edits a copy of the combat settings: Save puts the changed ones in the sheet's draft, Cancel
 * (or Esc) leaves the sheet as it was. Radix mounts the content on open, so the copy is fresh.
 */
export const CombatStatsDialog = ({
  section,
  onSaved,
}: {
  /** Hit points or the magic system: each card opens its own part. */
  section: CombatConfigSection;
  onSaved: () => void;
}) => {
  const character = useLoadedCharacter();
  const { update } = useCharacterActions();
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const tcommon = useTranslations('common');

  // What the dialog opened with, to tell what changed on Save
  const [initial] = useState<CombatConfig>(() => ({
    hpMax: character.hpMax,
    hpTemp: character.hpTemp,
    // Same default as the card on the sheet (MagicSystemCard)
    spellcastingSystem: character.spellcastingSystem || 'points',
    spellSlots: character.spellSlots,
    spellPoints: character.spellPoints,
  }));
  const [config, setConfig] = useState(initial);
  // Fields whose text isn't a valid number yet; saving waits for them
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(() => new Set());

  const set = (patch: Partial<CombatConfig>) => setConfig((prev) => ({ ...prev, ...patch }));
  const setValidity = (field: string) => (valid: boolean) =>
    setInvalid((prev) => {
      const next = new Set(prev);
      if (valid) next.delete(field);
      else next.add(field);
      return next;
    });

  const save = () => {
    // Only what changed, so opening and saving without edits leaves the sheet clean
    const changed: Partial<DnD5eCharacter> = Object.fromEntries(
      CONFIG_FIELDS[section]
        .filter((field) => JSON.stringify(config[field]) !== JSON.stringify(initial[field]))
        .map((field) => [field, config[field]]),
    );
    if (Object.keys(changed).length > 0) update(changed);
    onSaved();
  };

  return (
    <DialogContent
      className="character-context border-border bg-background p-0 shadow-2xl sm:max-w-[420px]"
      style={characterTheme(character.accentColor).style}
    >
      <DialogHeader className="border-border border-b p-6 pb-4">
        <div className="flex items-center gap-2">
          <AppIcon name="Settings2" size="sm" className="text-muted-foreground" />
          <DialogTitle>{section === 'hp' ? t('configureHp') : tm('titleConfig')}</DialogTitle>
          <DialogDescription className="sr-only">
            {section === 'hp' ? t('configureHpDescription') : tm('configDescription')}
          </DialogDescription>
        </div>
      </DialogHeader>

      {section === 'hp' && (
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 pb-2">
            <AppIcon name="Heart" size="sm" className="text-danger-flare" />
            <h3 className="text-label text-muted-foreground">{t('hitPoints')}</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hpMax" className="text-muted-foreground text-sm font-bold uppercase">
                {t('hitPointsMax')}
              </Label>
              <NumberInput
                id="hpMax"
                value={config.hpMax}
                min={1}
                max={32_767}
                onValueChange={(hpMax) => set({ hpMax })}
                onValidityChange={setValidity('hpMax')}
                className="border-border bg-muted focus:border-border h-9 transition-colors"
              />
            </div>

            <NumberStepper
              label={t('tempHp')}
              value={config.hpTemp || 0}
              onChange={(hpTemp) => set({ hpTemp })}
              max={2000}
            />
          </div>
        </div>
      )}

      {section === 'magic' && (
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 pb-2">
            <AppIcon name="Sparkles" size="sm" className="text-info-flare" />
            <h3 className="text-label text-muted-foreground">{tm('systemUsed')}</h3>
          </div>

          <Tabs
            value={config.spellcastingSystem}
            onValueChange={(val) => set({ spellcastingSystem: val as MagicSystem })}
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                  const level = lvl.toString();
                  return (
                    <NumberStepper
                      key={lvl}
                      label={tm('circle', { level: lvl })}
                      value={config.spellSlots?.[level]?.max || 0}
                      onChange={(max) =>
                        set({
                          spellSlots: {
                            ...config.spellSlots,
                            [level]: { max, used: config.spellSlots?.[level]?.used || 0 },
                          },
                        })
                      }
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="points" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm font-bold uppercase">
                  {tm('pointsCapacity')}
                </Label>
                <NumberInput
                  aria-label={tm('pointsCapacity')}
                  value={config.spellPoints?.max ?? 0}
                  min={0}
                  max={10_000}
                  onValueChange={(max) =>
                    set({ spellPoints: { current: config.spellPoints?.current ?? 0, max } })
                  }
                  onValidityChange={setValidity('pointsMax')}
                  className="border-border bg-muted focus:border-border h-9 transition-colors"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

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
            <Button
              variant="character"
              onClick={save}
              disabled={invalid.size > 0}
              className="h-9 px-6 text-sm font-bold uppercase"
            >
              {tcommon('save')}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};
