'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';

import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';
import rules from '@shared/systems/dnd5e/rules.json';

export default function PassivePerception() {
  const { attributes, level, skills } = useLoadedCharacter();
  const wisValue = attributes.WIS ?? 10;
  const perceptionSkillData = skills?.PERCEPTION;
  const t = useTranslations('characters');
  const isProficient = perceptionSkillData?.isProficient ?? false;
  const expertise = perceptionSkillData?.expertise ?? false;

  const passiveValue = calculatePassivePerception(wisValue, level, isProficient, expertise);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="border-border bg-card hover:border-character-muted focus-ring flex cursor-help items-center justify-between rounded-xl border p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-3">
            <AppIcon name="Eye" size={16} className="text-character-flare" aria-hidden="true" />
            <span className="text-label text-muted-foreground">{t('passivePerception')}</span>
          </div>
          <span className="text-foreground font-mono text-xl font-bold tabular-nums">
            {passiveValue}
          </span>
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
