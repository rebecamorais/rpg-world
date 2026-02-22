'use client';

import { calculatePassivePerception } from '@/systems/dnd5e/calculations';
import type { CharacterSkill } from '@/systems/dnd5e/types';

interface Props {
  wisValue: number;
  level: number;
  perceptionSkillData?: CharacterSkill;
}

export default function PassivePerception({
  wisValue,
  level,
  perceptionSkillData,
}: Props) {
  const isProficient = perceptionSkillData?.isProficient ?? false;
  const expertise = perceptionSkillData?.expertise ?? false;

  const passiveValue = calculatePassivePerception(
    wisValue,
    level,
    isProficient,
    expertise,
  );

  return (
    <div className="border-border bg-secondary flex items-center justify-between rounded border p-3">
      <span className="text-secondary-foreground text-sm font-semibold">
        Percepção Passiva
      </span>
      <span className="text-foreground font-mono text-lg font-bold">
        {passiveValue}
      </span>
    </div>
  );
}
