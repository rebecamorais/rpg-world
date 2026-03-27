'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

import { calculateSavingThrow } from '@shared/systems/dnd5e/calculations';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';
import rules from '@shared/systems/dnd5e/rules.json';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

interface Props {
  attributes: Record<AttributeKey, number>;
  level: number;
  savingThrows: Record<AttributeKey, boolean>;
  onSavingThrowChange: (key: AttributeKey, isProficient: boolean) => void;
}

function SavingThrowsSection({ attributes, level, savingThrows, onSavingThrowChange }: Props) {
  const t = useTranslations('attributes');
  const tSection = useTranslations('savingThrows');

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          {tSection('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 p-4">
        {ATTRIBUTE_KEYS.map((key) => {
          const attrVal = attributes[key] ?? 10;
          const isProficient = savingThrows[key] ?? false;
          const label = t(key);

          const finalValue = calculateSavingThrow(attrVal, level, isProficient);
          const sign = finalValue >= 0 ? '+' : '';

          return (
            <div
              key={key}
              className="group hover:bg-muted flex items-center gap-3 rounded p-1 transition-colors"
            >
              <button
                type="button"
                aria-label={
                  isProficient
                    ? t('proficientIn', { label }) // reused from attributes/skills or I should add to savingThrows?
                    : t('noProficiencyIn', { label })
                }
                onClick={() => onSavingThrowChange(key, !isProficient)}
                className={cn(
                  'h-3 w-3 flex-shrink-0 rounded-full border transition-all',
                  isProficient
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground group-hover:border-foreground bg-transparent',
                )}
              />
              <div className="flex flex-1 items-center justify-between text-sm">
                <span
                  className={cn(
                    'font-medium transition-colors',
                    isProficient ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'mx-2 cursor-help font-mono font-bold underline decoration-dotted underline-offset-4',
                        isProficient ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {sign}
                      {finalValue}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="font-semibold">{t('proficientIn', { label })}</p>
                      <p className="text-muted-foreground">{rules.formulas.savingThrow}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default React.memo(SavingThrowsSection);
