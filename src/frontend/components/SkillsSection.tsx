'use client';

import React from 'react';
import { SKILL_KEYS, SKILLS_CATALOG, type SkillKey } from '@/systems/dnd5e/constants';
import { calculateSkillValue } from '@/systems/dnd5e/calculations';
import type { CharacterSkill } from '@/systems/dnd5e/types';
import type { AttributeKey } from '@/systems/dnd5e';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { cn } from '@/backend/lib/utils';

interface Props {
    attributes: Record<AttributeKey, number>;
    level: number;
    skills: Partial<Record<SkillKey, CharacterSkill>>;
    onSkillChange: (key: SkillKey, skillData: CharacterSkill) => void;
}

export default function SkillsSection({ attributes, level, skills, onSkillChange }: Props) {
    return (
        <Card className="bg-[#1a1a1a] border-zinc-800">
            <CardHeader className="py-3 px-4 border-b border-zinc-800 bg-[#121212]/50">
                <CardTitle className="text-sm uppercase tracking-wider text-zinc-400">Perícias</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                        <div key={key} className="flex items-center gap-3 p-1 rounded hover:bg-zinc-800/50 transition-colors group">
                            <button
                                type="button"
                                aria-label={`Proficiência em ${cat.label}`}
                                onClick={() => onSkillChange(key, { ...skillData, isProficient: !skillData.isProficient })}
                                className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0 transition-all border",
                                    skillData.isProficient
                                        ? "bg-[#663399] border-[#663399]"
                                        : "bg-transparent border-zinc-600 group-hover:border-zinc-400"
                                )}
                            />
                            <div className="flex-1 flex text-sm">
                                <span className={cn(
                                    "font-medium transition-colors truncate flex-1",
                                    skillData.isProficient ? "text-zinc-100" : "text-zinc-400"
                                )}>
                                    {cat.label}
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono w-8 text-center self-center shrink-0">
                                    ({cat.attribute.slice(0, 3)})
                                </span>
                                <span className={cn(
                                    "font-mono font-bold mx-2 shrink-0 text-right w-6",
                                    skillData.isProficient ? "text-zinc-100" : "text-zinc-500"
                                )}>
                                    {sign}{finalValue}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
