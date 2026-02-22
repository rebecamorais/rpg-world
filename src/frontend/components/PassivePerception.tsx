'use client';

import { Info } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/frontend/components/ui/tooltip';
import { calculatePassivePerception } from '@/systems/dnd5e/calculations';
import rules from '@/systems/dnd5e/rules.json';
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
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="border-border bg-secondary hover:border-primary/50 flex cursor-help items-center justify-between rounded border p-3 transition-colors">
          <span className="text-secondary-foreground flex items-center gap-2 text-sm font-semibold">
            Percepção Passiva
            <Info className="text-muted-foreground h-4 w-4" />
          </span>
          <span className="text-foreground font-mono text-lg font-bold">
            {passiveValue}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">
            {rules.formulas.passivePerception}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
