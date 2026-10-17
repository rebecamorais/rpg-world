'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@frontend/components/ui/section-card';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setSkill } from '@frontend/lib/character-sheet-updates';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import { calculateSkillValue } from '@shared/systems/dnd5e/calculations';
import { SKILLS_CATALOG, SKILL_KEYS, type SkillKey } from '@shared/systems/dnd5e/constants';
import type { CharacterSkill } from '@shared/systems/dnd5e/types';

export default function SkillsSection() {
  const { attributes, level, skills = {} } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const onSkillChange = (key: SkillKey, skill: CharacterSkill) => update(setSkill(key, skill));
  const t = useTranslations('skills');
  const tAttr = useTranslations('attributes');

  // Prepare and sort skills alphabetically by their translated labels
  const sortedSkills = [...SKILL_KEYS]
    .map((key) => ({
      key,
      label: t(key),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const half = Math.ceil(sortedSkills.length / 2);
  const firstCol = sortedSkills.slice(0, half);
  const secondCol = sortedSkills.slice(half);

  const renderSkill = ({ key, label }: { key: SkillKey; label: string }) => {
    const cat = SKILLS_CATALOG[key];
    const attrVal = attributes[cat.attribute] ?? 10;
    const skillData = skills[key] ?? {
      isProficient: false,
      expertise: false,
    };

    const finalValue = calculateSkillValue(
      attrVal,
      level,
      skillData.isProficient,
      skillData.expertise,
    );

    const sign = finalValue >= 0 ? '+' : '';

    const toggleProficiency = () => {
      if (!skillData.isProficient) {
        // None -> Proficient
        onSkillChange(key, { isProficient: true, expertise: false });
      } else if (!skillData.expertise) {
        // Proficient -> Expertise
        onSkillChange(key, { isProficient: true, expertise: true });
      } else {
        // Expertise -> None
        onSkillChange(key, { isProficient: false, expertise: false });
      }
    };

    return (
      <div
        key={key}
        className="group hover:bg-muted flex items-center rounded p-1 transition-colors"
      >
        {/* The whole name toggles, not just the 14px dot, so it is easy to hit on a phone */}
        <button
          type="button"
          aria-label={
            skillData.expertise
              ? t('expertiseIn', { label })
              : skillData.isProficient
                ? t('proficientIn', { label })
                : t('noProficiencyIn', { label })
          }
          onClick={toggleProficiency}
          className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left text-sm"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
              skillData.isProficient
                ? 'border-character bg-character'
                : 'border-muted-foreground group-hover:border-foreground bg-transparent',
            )}
          >
            {skillData.expertise && <span className="bg-background h-1 w-1 rounded-full" />}
          </span>
          <span
            className={cn(
              'flex-1 truncate font-medium transition-colors',
              skillData.isProficient ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          <span className="text-muted-foreground w-8 shrink-0 self-center text-center font-mono text-xs">
            ({tAttr(`abbreviations.${cat.attribute}`)})
          </span>
        </button>
        <div className="flex text-sm">
          <span
            className={cn(
              'mx-2 w-6 shrink-0 text-right font-mono font-bold',
              getStatColorClass(finalValue),
            )}
          >
            {sign}
            {finalValue}
          </span>
        </div>
      </div>
    );
  };

  return (
    <SectionCard className="w-full">
      <SectionCard.Header>
        <SectionCard.Title icon="Scroll">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <div className="flex flex-col gap-y-2">{firstCol.map(renderSkill)}</div>
        <div className="flex flex-col gap-y-2">{secondCol.map(renderSkill)}</div>
      </SectionCard.Body>
    </SectionCard>
  );
}
