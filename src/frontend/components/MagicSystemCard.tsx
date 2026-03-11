'use client';

import { useState } from 'react';

import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { DnD5eCharacter } from '@shared/systems/dnd5e/types';
import { Droplet, Settings2, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MagicSystemCardProps {
  character: DnD5eCharacter;
  onChangeSystem: (system: 'slots' | 'points') => void;
  onChangePoints: (field: 'current' | 'max', value: number) => void;
  onChangeSlots: (level: string, max: number, used: number) => void;
}

export default function MagicSystemCard({
  character,
  onChangeSystem,
  onChangePoints,
  onChangeSlots,
}: MagicSystemCardProps) {
  const t = useTranslations('magicSystem');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const sys = character.spellcastingSystem || 'slots';

  // Toggle do slot consumido/desconsumido:
  const handleSlotToggle = (
    levelStr: string,
    currentUsed: number,
    totalMax: number,
    increase: boolean,
  ) => {
    let newUsed = increase ? currentUsed + 1 : currentUsed - 1;
    if (newUsed < 0) newUsed = 0;
    if (newUsed > totalMax) newUsed = totalMax;
    onChangeSlots(levelStr, totalMax, newUsed);
  };

  return (
    <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
      <Card className="border-border bg-card relative flex w-full flex-col items-center justify-center px-2 py-4">
        <DialogTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground absolute top-2 right-2 transition-colors">
            <Settings2 className="h-4 w-4" />
          </button>
        </DialogTrigger>

        {sys === 'points' ? (
          <div className="z-10 flex w-full flex-col items-center">
            <Droplet className="mb-2 h-6 w-6 text-blue-500 drop-shadow-md" />
            <div className="flex w-full items-baseline justify-center gap-1 px-2">
              <Input
                type="number"
                value={character.spellPoints?.current ?? 0}
                onChange={(e) =>
                  onChangePoints('current', parseInt(e.target.value) || 0)
                }
                className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-right text-3xl font-bold focus-visible:ring-2"
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                value={character.spellPoints?.max ?? 0}
                onChange={(e) =>
                  onChangePoints('max', parseInt(e.target.value) || 0)
                }
                className="focus-visible:ring-primary text-muted-foreground h-10 w-12 border-transparent bg-transparent p-0 text-left text-xl font-bold focus-visible:ring-2"
              />
            </div>
            <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
              {t('spellPoints')}
            </span>
          </div>
        ) : (
          <div className="z-10 flex w-full flex-col items-center px-4">
            <Wand2 className="mb-2 h-6 w-6 text-indigo-400 drop-shadow-md" />

            <div className="mt-2 flex w-full flex-col gap-2">
              {/* Itera sobre os slots se existirem, caso contrário mostra um placeholder elegante */}
              {character.spellSlots &&
              Object.keys(character.spellSlots).length > 0 ? (
                // Ordernar chaves numéricas do 1 ao 9
                Object.entries(character.spellSlots)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([lvl, data]) => (
                    <div
                      key={lvl}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground mr-2 font-bold">
                        {t('level', { level: lvl })}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: data.max }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              handleSlotToggle(
                                lvl,
                                data.used,
                                data.max,
                                i >= data.used,
                              )
                            }
                            className={`h-4 w-4 rounded-full border-2 transition-colors ${
                              i < data.used
                                ? 'border-primary cursor-pointer bg-transparent opacity-30' // Gasto (vazio)
                                : 'border-primary bg-primary cursor-pointer' // Disponível (cheio)
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <span className="text-muted-foreground mt-1 text-center text-xs">
                  {t('noSlotsConfigured')}
                </span>
              )}
            </div>

            <span className="text-muted-foreground mt-3 text-[10px] font-bold uppercase">
              {t('spellSlots')}
            </span>
          </div>
        )}
      </Card>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('titleConfig')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-3">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              {t('systemUsed')}
            </Label>
            <div className="bg-muted flex w-full rounded-md p-1">
              <button
                onClick={() => onChangeSystem('slots')}
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-all ${sys === 'slots' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {t('slotsOfficial')}
              </button>
              <button
                onClick={() => onChangeSystem('points')}
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-all ${sys === 'points' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {t('manaHomebrew')}
              </button>
            </div>
          </div>

          {sys === 'slots' && (
            <div className="flex max-h-[40vh] flex-col gap-4 overflow-y-auto pr-2">
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                {t('slotsCapacity')}
              </Label>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const currentData = character.spellSlots?.[lvl.toString()] || {
                  max: 0,
                  used: 0,
                };
                return (
                  <div
                    key={lvl}
                    className="flex items-center justify-between gap-4"
                  >
                    <Label className="min-w-16">
                      {t('circle', { level: lvl })}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="4"
                      value={currentData.max}
                      onChange={(e) =>
                        onChangeSlots(
                          lvl.toString(),
                          parseInt(e.target.value) || 0,
                          Math.min(
                            currentData.used,
                            parseInt(e.target.value) || 0,
                          ),
                        )
                      }
                      className="w-20"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={() => setIsConfigOpen(false)}>
            {t('done')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
