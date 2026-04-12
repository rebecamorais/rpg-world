'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import { calculateSavingThrow } from '@shared/systems/dnd5e/calculations';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';
import rules from '@shared/systems/dnd5e/rules.json';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

interface Props {
  attributes: Record<AttributeKey, number>;
  level: number;
  savingThrows: Record<AttributeKey, boolean>;
  deathSaves?: { successes: number; failures: number };
  onSavingThrowChange: (key: AttributeKey, isProficient: boolean) => void;
  onDeathSavesChange?: (successes: number, failures: number) => void;
}

interface DeathSavesProps {
  deathSaves?: { successes: number; failures: number };
  onDeathSavesChange?: (successes: number, failures: number) => void;
}

const DeathSaves = ({ deathSaves, onDeathSavesChange }: DeathSavesProps) => {
  return (
    <div className="flex items-center justify-center bg-zinc-500/5 py-4">
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          {[2, 1, 0].map((i) => (
            <button
              key={`succ-${i}`}
              onClick={() =>
                onDeathSavesChange?.(
                  deathSaves?.successes === i + 1 ? i : i + 1,
                  deathSaves?.failures || 0,
                )
              }
              className={cn(
                'h-3.5 w-3.5 rounded-full border-2 transition-all duration-300',
                (deathSaves?.successes || 0) > i
                  ? 'border-green bg-green shadow-[0_0_12px_var(--color-green-muted)]'
                  : 'border-green-surface hover:border-green-muted',
              )}
            />
          ))}
        </div>

        <AppIcon
          name="death-skull"
          size="sm"
          variant="game"
          className={cn(
            'cursor-pointer text-zinc-500 transition-all duration-300 hover:scale-110 hover:text-white',
            ((deathSaves?.successes || 0) > 0 || (deathSaves?.failures || 0) > 0) &&
              'text-zinc-400',
          )}
          onClick={() => onDeathSavesChange?.(0, 0)}
        />

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={`fail-${i}`}
              onClick={() =>
                onDeathSavesChange?.(
                  deathSaves?.successes || 0,
                  deathSaves?.failures === i + 1 ? i : i + 1,
                )
              }
              className={cn(
                'h-3.5 w-3.5 rounded-full border-2 transition-all duration-300',
                (deathSaves?.failures || 0) > i
                  ? 'border-red bg-red shadow-[0_0_12px_var(--color-red-muted)]'
                  : 'border-red-surface hover:border-red-muted',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function SavingThrowsSection({
  attributes,
  level,
  savingThrows,
  deathSaves,
  onSavingThrowChange,
  onDeathSavesChange,
}: Props) {
  const t = useTranslations('attributes');
  const tSection = useTranslations('savingThrows');

  return (
    <Card className="border-border bg-card">
      <CardHeader className="bg-muted/30 border-border border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <AppIcon
            name="shield-reflect"
            variant="game"
            size="lg"
            className="text-character-flare"
          />
          <CardTitle className="text-xs font-bold tracking-widest uppercase opacity-70">
            {tSection('title')}
          </CardTitle>
        </div>
      </CardHeader>
      <DeathSaves deathSaves={deathSaves} onDeathSavesChange={onDeathSavesChange} />
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
                  isProficient ? t('proficientIn', { label }) : t('noProficiencyIn', { label })
                }
                onClick={() => onSavingThrowChange(key, !isProficient)}
                className={cn(
                  'h-3 w-3 flex-shrink-0 rounded-full border-2 transition-all',
                  isProficient
                    ? 'border-character bg-character'
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
                        getStatColorClass(finalValue),
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
