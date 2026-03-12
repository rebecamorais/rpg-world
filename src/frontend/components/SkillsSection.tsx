'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { cn } from '@frontend/lib/utils';

import type { AttributeKey } from '@shared/systems/dnd5e';
import { calculateSkillValue } from '@shared/systems/dnd5e/calculations';
import { SKILLS_CATALOG, SKILL_KEYS, type SkillKey } from '@shared/systems/dnd5e/constants';
import type { CharacterSkill } from '@shared/systems/dnd5e/types';

interface Props {
  attributes: Record<AttributeKey, number>;
  level: number;
  skills: Partial<Record<SkillKey, CharacterSkill>>;
  onSkillChange: (key: SkillKey, skillData: CharacterSkill) => void;
}

export default function SkillsSection({ attributes, level, skills, onSkillChange }: Props) {
  const t = useTranslations('skills');

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
        className="group hover:bg-muted flex items-center gap-3 rounded p-1 transition-colors"
      >
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
          className={cn(
            'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border transition-all',
            skillData.isProficient
              ? 'border-primary bg-primary'
              : 'border-muted-foreground group-hover:border-foreground bg-transparent',
          )}
        >
          {skillData.expertise && <div className="bg-background h-1 w-1 rounded-full" />}
        </button>
        <div className="flex flex-1 text-sm">
          <span
            className={cn(
              'flex-1 truncate font-medium transition-colors',
              skillData.isProficient ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          <span className="text-muted-foreground w-8 shrink-0 self-center text-center font-mono text-[10px]">
            ({cat.attribute.slice(0, 3)})
          </span>
          <span
            className={cn(
              'mx-2 w-6 shrink-0 text-right font-mono font-bold',
              skillData.isProficient ? 'text-foreground' : 'text-muted-foreground',
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
    <Card className="border-border bg-card w-full">
      <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-8 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-y-2">{firstCol.map(renderSkill)}</div>
        <div className="flex flex-col gap-y-2">{secondCol.map(renderSkill)}</div>
      </CardContent>
    </Card>
  );
}
