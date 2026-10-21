'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@frontend/components/ui/section-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setSavingThrow } from '@frontend/lib/character-sheet-updates';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import { calculateSavingThrow } from '@shared/systems/dnd5e/calculations';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';
import rules from '@shared/systems/dnd5e/rules.json';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

export default function SavingThrowsSection() {
  const { attributes, level, savingThrowProficiencies: savingThrows } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const onSavingThrowChange = (key: AttributeKey, isProficient: boolean) =>
    update(setSavingThrow(key, isProficient));
  const t = useTranslations('attributes');
  const tSection = useTranslations('savingThrows');

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="shield-reflect" iconVariant="game" hint={tSection('hint')}>
          {tSection('title')}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="grid grid-cols-1 gap-2">
        {ATTRIBUTE_KEYS.map((key) => {
          const attrVal = attributes[key] ?? 10;
          const isProficient = savingThrows[key] ?? false;
          const label = t(key);

          const finalValue = calculateSavingThrow(attrVal, level, isProficient);
          const sign = finalValue >= 0 ? '+' : '';
          const stateLabel = isProficient
            ? t('proficientIn', { label })
            : t('noProficiencyIn', { label });

          return (
            <div
              key={key}
              className="group hover:bg-muted flex items-center gap-3 rounded p-1 transition-colors"
            >
              {/* The whole name toggles, not just the 12px dot, so it is easy to hit on a phone */}
              <button
                type="button"
                aria-label={stateLabel}
                onClick={() => onSavingThrowChange(key, !isProficient)}
                className="focus-ring flex flex-1 items-center gap-3 rounded-sm text-left text-sm"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-3 w-3 flex-shrink-0 rounded-full border-2 transition-all',
                    isProficient
                      ? 'border-character bg-character'
                      : 'border-muted-foreground group-hover:border-foreground bg-transparent',
                  )}
                />
                <span
                  className={cn(
                    'font-medium transition-colors',
                    isProficient ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              <div className="text-sm">
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
                      <p className="font-semibold">{stateLabel}</p>
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
