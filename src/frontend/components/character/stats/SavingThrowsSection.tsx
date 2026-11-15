'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useClassDefaults } from '@frontend/hooks/useClassDefaults';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { inheritSavingThrow, setSavingThrow } from '@frontend/lib/character-sheet-updates';
import { cn } from '@frontend/lib/utils';

import { calculateSavingThrow } from '@shared/systems/dnd5e/calculations';
import { effectiveSavingThrows } from '@shared/systems/dnd5e/class-defaults';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

import { ProficiencyDot, ProficiencyLegend, proficiencyValueClass } from './ProficiencyLegend';

export default function SavingThrowsSection() {
  const { attributes, level, savingThrowProficiencies, system } = useLoadedCharacter();
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id, system);
  const defaults = useClassDefaults();
  // What the player set by hand wins; the rest is what the class gives
  const savingThrows = effectiveSavingThrows(savingThrowProficiencies, defaults);
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
        <SectionCard.Actions>
          <ProficiencyLegend />
        </SectionCard.Actions>
      </SectionCard.Header>
      <SectionCard.Body className="grid grid-cols-1 gap-2">
        {ATTRIBUTE_KEYS.map((key) => {
          const attrVal = attributes[key] ?? 10;
          const { proficient: isProficient, source, classDefault } = savingThrows[key];
          // Only where it shows: a value set by hand that is what the class gives anyway changes
          // nothing on screen, so it gets no button
          const differsFromClass =
            defaults !== null && source === 'manual' && isProficient !== classDefault;
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
                <ProficiencyDot proficient={isProficient} className="h-3 w-3" />
                <span
                  className={cn(
                    'font-medium transition-colors',
                    isProficient ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              {differsFromClass && !readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={tSection('followClass', { label })}
                  title={tSection('followClass', { label })}
                  onClick={() => update(inheritSavingThrow(key))}
                >
                  <AppIcon name="RotateCcw" aria-hidden="true" />
                </Button>
              )}
              {/* No per-row tooltip (it only opened on hover): the title's hint explains the roll,
                  and the toggle's name says whether the row is proficient */}
              <span
                className={cn(
                  'mx-2 font-mono text-sm font-bold',
                  proficiencyValueClass(finalValue, isProficient),
                )}
              >
                {sign}
                {finalValue}
              </span>
            </div>
          );
        })}
      </SectionCard.Body>
    </SectionCard>
  );
}
