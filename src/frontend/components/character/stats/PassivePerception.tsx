'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';

import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';
import rules from '@shared/systems/dnd5e/rules.json';
import type { CharacterSkill } from '@shared/systems/dnd5e/types';

interface Props {
  wisValue: number;
  level: number;
  perceptionSkillData?: CharacterSkill;
}

function PassivePerception({ wisValue, level, perceptionSkillData }: Props) {
  const t = useTranslations('characters');
  const isProficient = perceptionSkillData?.isProficient ?? false;
  const expertise = perceptionSkillData?.expertise ?? false;

  const passiveValue = calculatePassivePerception(wisValue, level, isProficient, expertise);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="border-border bg-card hover:border-primary/50 flex cursor-help items-center justify-between rounded-lg border p-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <AppIcon name="Eye" size={16} className="text-character drop-shadow-sm" />
            <span className="text-xs font-bold tracking-widest uppercase opacity-70">
              {t('passivePerception')}
            </span>
          </div>
          <span className="text-foreground font-mono text-xl font-bold">{passiveValue}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">{rules.formulas.passivePerception}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default React.memo(PassivePerception);
