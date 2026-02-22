'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { cn } from '@/frontend/lib/utils';
import type { AttributeKey } from '@/systems/dnd5e';
import { calculateSkillValue } from '@/systems/dnd5e/calculations';
import {
  SKILLS_CATALOG,
  SKILL_KEYS,
  type SkillKey,
} from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';

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
    <Card className="border-zinc-800 bg-[#1a1a1a]">
      <CardHeader className="border-b border-zinc-800 bg-[#121212]/50 px-4 py-3">
        <CardTitle className="text-sm tracking-wider text-zinc-400 uppercase">
          Perícias
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex items-center gap-3 rounded p-1 transition-colors hover:bg-zinc-800/50"
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
                    : 'border-zinc-600 bg-transparent group-hover:border-zinc-400',
                )}
              />
              <div className="flex flex-1 text-sm">
                <span
                  className={cn(
                    'flex-1 truncate font-medium transition-colors',
                    skillData.isProficient ? 'text-zinc-100' : 'text-zinc-400',
                  )}
                >
                  {cat.label}
                </span>
                <span className="w-8 shrink-0 self-center text-center font-mono text-[10px] text-zinc-600">
                  ({cat.attribute.slice(0, 3)})
                </span>
                <span
                  className={cn(
                    'mx-2 w-6 shrink-0 text-right font-mono font-bold',
                    skillData.isProficient ? 'text-zinc-100' : 'text-zinc-500',
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
