'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { cn } from '@/frontend/lib/utils';
import type { AttributeKey } from '@/shared/systems/dnd5e';
import { calculateSkillValue } from '@/shared/systems/dnd5e/calculations';
import {
  SKILLS_CATALOG,
  SKILL_KEYS,
  type SkillKey,
} from '@/shared/systems/dnd5e/constants';
import type { CharacterSkill } from '@/shared/systems/dnd5e/types';

interface Props {
  attributes: Record<AttributeKey, number>;
  level: number;
  skills: Partial<Record<SkillKey, CharacterSkill>>;
  onSkillChange: (key: SkillKey, skillData: CharacterSkill) => void;
}

export default function SkillsSection({
  attributes,
  level,
  skills,
  onSkillChange,
}: Props) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          Perícias
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 p-4">
        {SKILL_KEYS.map((key) => {
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

          return (
            <div
              key={key}
              className="group hover:bg-muted flex items-center gap-3 rounded p-1 transition-colors"
            >
              <button
                type="button"
                aria-label={`Proficiência em ${cat.label}`}
                onClick={() =>
                  onSkillChange(key, {
                    ...skillData,
                    isProficient: !skillData.isProficient,
                  })
                }
                className={cn(
                  'h-3 w-3 flex-shrink-0 rounded-full border transition-all',
                  skillData.isProficient
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground group-hover:border-foreground bg-transparent',
                )}
              />
              <div className="flex flex-1 text-sm">
                <span
                  className={cn(
                    'flex-1 truncate font-medium transition-colors',
                    skillData.isProficient
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {cat.label}
                </span>
                <span className="text-muted-foreground w-8 shrink-0 self-center text-center font-mono text-[10px]">
                  ({cat.attribute.slice(0, 3)})
                </span>
                <span
                  className={cn(
                    'mx-2 w-6 shrink-0 text-right font-mono font-bold',
                    skillData.isProficient
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {sign}
                  {finalValue}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
