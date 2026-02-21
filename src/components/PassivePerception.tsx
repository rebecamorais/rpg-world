'use client';

import { calculatePassivePerception } from '@/systems/dnd5e/calculations';
import type { CharacterSkill } from '@/systems/dnd5e/types';

interface Props {
    wisValue: number;
    level: number;
    perceptionSkillData?: CharacterSkill;
}

export default function PassivePerception({ wisValue, level, perceptionSkillData }: Props) {
    const isProficient = perceptionSkillData?.isProficient ?? false;
    const expertise = perceptionSkillData?.expertise ?? false;

    const passiveValue = calculatePassivePerception(wisValue, level, isProficient, expertise);

    return (
        <div className="flex items-center justify-between p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Percepção Passiva
            </span>
            <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {passiveValue}
            </span>
        </div>
    );
}
