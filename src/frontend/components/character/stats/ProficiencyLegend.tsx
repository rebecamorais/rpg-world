'use client';

import { useTranslations } from 'next-intl';

import { Hint } from '@frontend/components/ui/hint';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharacterMeta, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { cn } from '@frontend/lib/utils';

interface ProficiencyDotProps {
  proficient: boolean;
  expertise?: boolean;
  className?: string;
}

/** Empty: no proficiency. Filled: proficient. Filled with a hole: expertise. */
export function ProficiencyDot({ proficient, expertise, className }: ProficiencyDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
        proficient
          ? 'border-character bg-character'
          : 'border-muted-foreground group-hover:border-foreground bg-transparent',
        className,
      )}
    >
      {expertise && <span className="bg-background h-1 w-1 rounded-full" />}
    </span>
  );
}

/** The accent marks what the character is proficient in; negatives stay red, the rest neutral. */
export function proficiencyValueClass(value: number, proficient: boolean) {
  if (value < 0) return 'text-danger-flare';
  return proficient ? 'text-character-flare' : 'text-muted-foreground';
}

/**
 * What the dots mean, behind a help icon (hover or tap), so the sheet stays clean. Says how to
 * change them only when the sheet can be edited.
 */
export function ProficiencyLegend({ withExpertise = false }: { withExpertise?: boolean }) {
  const t = useTranslations('skills');
  const { id } = useCharacterMeta();
  const { system } = useLoadedCharacter();
  const { readOnly } = useSheetSource(id, system);

  const states = [
    { label: t('none'), proficient: false, expertise: false },
    { label: t('proficient'), proficient: true, expertise: false },
    ...(withExpertise ? [{ label: t('expertise'), proficient: true, expertise: true }] : []),
  ];

  return (
    <Hint
      label={t('legend')}
      hint={
        <div className="mt-1 flex flex-col gap-2">
          <ul className="flex flex-col gap-1.5">
            {states.map((state) => (
              <li key={state.label} className="text-foreground flex items-center gap-2">
                <ProficiencyDot proficient={state.proficient} expertise={state.expertise} />
                {state.label}
              </li>
            ))}
          </ul>
          {!readOnly && <p>{t('legendHint')}</p>}
        </div>
      }
      className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center"
    >
      <AppIcon name="CircleHelp" size={16} aria-hidden="true" />
    </Hint>
  );
}
