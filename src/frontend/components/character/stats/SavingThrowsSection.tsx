'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
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
  const t = useTranslations('savingThrows');

  return (
    <div className="bg-muted/20 border-border flex items-center justify-center border-b py-4">
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          {[2, 1, 0].map((i) => (
            <button
              key={`succ-${i}`}
              type="button"
              aria-label={t('deathSaveSuccess', { count: i + 1 })}
              aria-pressed={(deathSaves?.successes || 0) > i}
              onClick={() =>
                onDeathSavesChange?.(
                  deathSaves?.successes === i + 1 ? i : i + 1,
                  deathSaves?.failures || 0,
                )
              }
              className={cn(
                'h-3.5 w-3.5 rounded-full border-2 transition-all duration-300',
                (deathSaves?.successes || 0) > i
                  ? 'border-success bg-success shadow-[0_0_12px_var(--color-success-muted)]'
                  : 'border-success-surface hover:border-success-muted',
              )}
            />
          ))}
        </div>

        <button
          type="button"
          className="focus-ring touch-target rounded-full"
          aria-label={t('resetDeathSaves')}
          onClick={() => onDeathSavesChange?.(0, 0)}
        >
          <AppIcon
            name="death-skull"
            size="sm"
            variant="game"
            className={cn(
              'text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-300 hover:scale-110',
              ((deathSaves?.successes || 0) > 0 || (deathSaves?.failures || 0) > 0) &&
                'text-foreground',
            )}
          />
        </button>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={`fail-${i}`}
              type="button"
              aria-label={t('deathSaveFailure', { count: i + 1 })}
              aria-pressed={(deathSaves?.failures || 0) > i}
              onClick={() =>
                onDeathSavesChange?.(
                  deathSaves?.successes || 0,
                  deathSaves?.failures === i + 1 ? i : i + 1,
                )
              }
              className={cn(
                'h-3.5 w-3.5 rounded-full border-2 transition-all duration-300',
                (deathSaves?.failures || 0) > i
                  ? 'border-danger bg-danger shadow-[0_0_12px_var(--color-danger-muted)]'
                  : 'border-danger-surface hover:border-danger-muted',
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
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="shield-reflect" iconVariant="game">
          {tSection('title')}
        </SectionCard.Title>
      </SectionCard.Header>
      <DeathSaves deathSaves={deathSaves} onDeathSavesChange={onDeathSavesChange} />
      <SectionCard.Body className="grid grid-cols-1 gap-2">
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
      </SectionCard.Body>
    </SectionCard>
  );
}

export default React.memo(SavingThrowsSection);
