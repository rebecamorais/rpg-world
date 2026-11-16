'use client';

import { useId, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { useItems } from '@frontend/hooks/useItems';

import {
  type ClassChoice,
  type ClassChoiceSelections,
  choiceOptions,
  countedSelections,
} from '@shared/systems/dnd5e/class-choices';
import type { SkillKey } from '@shared/systems/dnd5e/constants';

/**
 * The class's level 1 picks (skills, tools) on the creation form, each with how many are picked
 * out of how many it asks for. Nothing here is required: the character is created with whatever
 * is picked. Picks are kept by the choice's identity, so switching class and back finds them.
 */
export function ClassChoicesStep({
  choices,
  picks,
  disabled,
  onChange,
}: {
  choices: ClassChoice[];
  picks: ClassChoiceSelections;
  disabled?: boolean;
  onChange: (picks: ClassChoiceSelections) => void;
}) {
  const t = useTranslations('characterCreation');
  const set = (key: string) => (picked: string[]) => onChange({ ...picks, [key]: picked });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-muted-foreground">{t('choicesHint')}</p>
      {choices.map((choice) =>
        choice.kind === 'skills' ? (
          <SkillChoice
            key={choice.key}
            choice={choice}
            picked={picks[choice.key]}
            disabled={disabled}
            onChange={set(choice.key)}
          />
        ) : (
          <ToolChoice
            key={choice.key}
            choice={choice}
            picked={picks[choice.key]}
            disabled={disabled}
            onChange={set(choice.key)}
          />
        ),
      )}
    </div>
  );
}

interface ChoiceProps {
  choice: ClassChoice;
  picked: string[] | undefined;
  disabled?: boolean;
  onChange: (picked: string[]) => void;
}

function SkillChoice(props: ChoiceProps) {
  const t = useTranslations('characterCreation');
  const tSkills = useTranslations('skills');
  return (
    <ChoiceGroup {...props} title={t('choiceSkills')} labelOf={(id) => tSkills(id as SkillKey)} />
  );
}

/** Tools are named by the item catalog, loaded only when the class has a tool to pick. */
function ToolChoice(props: ChoiceProps) {
  const t = useTranslations('characterCreation');
  const { list } = useItems();
  const names = useMemo(
    () => new Map(list.filter((item) => item.edition === '2014').map((i) => [i.id, i.name])),
    [list],
  );
  return <ChoiceGroup {...props} title={t('choiceTools')} labelOf={(id) => names.get(id) ?? id} />;
}

function ChoiceGroup({
  choice,
  picked,
  disabled,
  onChange,
  title,
  labelOf,
}: ChoiceProps & { title: string; labelOf: (id: string) => string }) {
  const t = useTranslations('characterCreation');
  const countId = useId();
  const counted = countedSelections(choice, picked);
  const full = counted.length >= choice.count;
  const options = choiceOptions(choice)
    .map((id) => ({ id, label: labelOf(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const toggle = (id: string) =>
    onChange(counted.includes(id) ? counted.filter((other) => other !== id) : [...counted, id]);

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={countId}>
      <legend className="text-label text-muted-foreground">{title}</legend>
      <p id={countId} aria-live="polite" className="text-caption text-muted-foreground">
        {t('choiceCount', { picked: counted.length, count: choice.count })}
      </p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {options.map(({ id, label }) => {
          const checked = counted.includes(id);
          return (
            <li key={id}>
              <label className="flex min-h-9 cursor-pointer items-center gap-2 py-1 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60 pointer-coarse:min-h-11">
                <input
                  type="checkbox"
                  checked={checked}
                  // Full: the rest wait until one is unticked, so no more than asked are picked
                  disabled={disabled || (!checked && full)}
                  onChange={() => toggle(id)}
                  className="focus-ring accent-primary size-4 shrink-0"
                />
                {label}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
