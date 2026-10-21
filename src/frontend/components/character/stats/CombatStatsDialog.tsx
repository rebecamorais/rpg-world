'use client';

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

export type CombatConfigSection = 'hp' | 'magic';

/**
 * Settings of one sheet card. Changes go to the sheet's draft right away, like any other edit on
 * the sheet; the sheet's save bar is what saves them.
 */
export const CombatStatsDialog = ({
  section,
}: {
  /** Hit points or the magic system: each card opens its own part. */
  section: CombatConfigSection;
}) => {
  const character = useLoadedCharacter();
  const { update } = useCharacterActions();
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const tcommon = useTranslations('common');

  // Same default as the card on the sheet (MagicSystemCard)
  const system = character.spellcastingSystem || 'points';

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
                value={character.hpMax}
                min={1}
                max={32_767}
                onValueChange={(hpMax) => update({ hpMax })}
                className="border-border bg-muted focus:border-border h-9 transition-colors"
              />
            </div>

            <NumberStepper
              label={t('tempHp')}
              value={character.hpTemp || 0}
              onChange={(hpTemp) => update({ hpTemp })}
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
            value={system}
            onValueChange={(val) => update({ spellcastingSystem: val as MagicSystem })}
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
                      value={character.spellSlots?.[level]?.max || 0}
                      onChange={(max) =>
                        update({
                          spellSlots: {
                            ...character.spellSlots,
                            [level]: { max, used: character.spellSlots?.[level]?.used || 0 },
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
                  value={character.spellPoints?.max ?? 0}
                  min={0}
                  max={10_000}
                  onValueChange={(max) =>
                    update({ spellPoints: { current: character.spellPoints?.current ?? 0, max } })
                  }
                  className="border-border bg-muted focus:border-border h-9 transition-colors"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <DialogFooter className="border-border bg-muted/50 border-t p-6">
        <DialogClose asChild>
          <Button variant="character" className="h-9 px-6 text-sm font-bold uppercase">
            {tcommon('done')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};
