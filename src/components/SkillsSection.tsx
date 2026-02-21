'use client';

import { SKILL_KEYS, SKILLS_CATALOG, type SkillKey } from '@/systems/dnd5e/constants';
import { calculateSkillValue } from '@/systems/dnd5e/calculations';
import type { CharacterSkill } from '@/systems/dnd5e/types';
import type { AttributeKey } from '@/systems/dnd5e';

interface Props {
    attributes: Record<AttributeKey, number>;
    level: number;
    skills: Partial<Record<SkillKey, CharacterSkill>>;
    onSkillChange: (key: SkillKey, skillData: CharacterSkill) => void;
}

export default function SkillsSection({ attributes, level, skills, onSkillChange }: Props) {
    return (
        <div className="mt-8">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Perícias
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {SKILL_KEYS.map((key) => {
                    const cat = SKILLS_CATALOG[key];
                    const attrVal = attributes[cat.attribute] ?? 10;
                    const skillData = skills[key] ?? { isProficient: false, expertise: false };

                    const finalValue = calculateSkillValue(
                        attrVal,
                        level,
                        skillData.isProficient,
                        skillData.expertise
                    );

                    const sign = finalValue >= 0 ? '+' : '';

                    return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={skillData.isProficient}
                                    onChange={(e) => onSkillChange(key, { ...skillData, isProficient: e.target.checked })}
                                    className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-indigo-600 focus:ring-indigo-600"
                                    aria-label={`Proficiência em ${cat.label}`}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{cat.label}</span>
                                    <span className="text-xs text-zinc-500 uppercase">{cat.attribute}</span>
                                </div>
                            </div>
                            <div className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">
                                {sign}{finalValue}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
