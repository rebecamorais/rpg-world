'use client';

import { Footprints, Heart, Shield, Swords } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { HealthBar } from '@frontend/components/ui/health-bar';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

interface CombatStatsSectionProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
}

export default function CombatStatsSection({
  character,
  onBasicInfoChange,
}: CombatStatsSectionProps) {
  const t = useTranslations('combatStats');

  const hpMax = character.hpMax || 1;
  const hpCurrent = character.hpCurrent || 0;
  const hpTemp = character.hpTemp || 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6 lg:grid-cols-7">
      {/* HP Bento Card (Spans 2-3 columns) */}
      <Card className="group border-border bg-card/50 hover:bg-card relative col-span-2 flex min-h-[100px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors md:col-span-3 lg:col-span-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500 drop-shadow-sm" />
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('hitPoints')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
            <span className="text-yellow-500">{t('tempHp')}</span>
            <GhostInput
              type="number"
              value={hpTemp}
              onChange={(e) => onBasicInfoChange('hpTemp', parseInt(e.target.value) || 0)}
              className="h-5 w-10 text-right text-xs font-bold text-yellow-500"
            />
          </div>
        </div>

        <div className="my-2 flex items-baseline gap-1">
          <GhostInput
            type="number"
            value={hpCurrent}
            onChange={(e) => onBasicInfoChange('hpCurrent', parseInt(e.target.value) || 0)}
            className="h-8 w-16 text-3xl font-bold"
          />
          <span className="text-muted-foreground text-sm font-medium">/</span>
          <GhostInput
            type="number"
            value={hpMax}
            onChange={(e) => onBasicInfoChange('hpMax', parseInt(e.target.value) || 0)}
            className="text-muted-foreground h-6 w-12 text-lg font-semibold"
          />
        </div>

        <HealthBar current={hpCurrent} max={hpMax} temp={hpTemp} className="mt-auto" />
      </Card>

      {/* Compact Status Badges */}

      {/* Armor Class */}
      <Card className="border-border bg-card/50 hover:bg-card col-span-1 flex flex-col items-center justify-center p-3 shadow-sm transition-colors">
        <div className="flex flex-col items-center gap-1">
          <Shield className="text-primary mb-1 h-5 w-5 drop-shadow-sm" />
          <GhostInput
            type="number"
            value={character.ac ?? 0}
            onChange={(e) => onBasicInfoChange('ac', parseInt(e.target.value) || 0)}
            className="h-6 w-12 text-center text-2xl font-bold"
          />
          <span className="text-muted-foreground mt-1 text-[9px] font-bold tracking-wider uppercase">
            {t('armorClass')}
          </span>
        </div>
      </Card>

      {/* Initiative */}
      <Card className="border-border bg-card/50 hover:bg-card col-span-1 flex flex-col items-center justify-center p-3 shadow-sm transition-colors">
        <div className="flex flex-col items-center gap-1">
          <Swords className="mb-1 h-5 w-5 text-orange-500 drop-shadow-sm" />
          <GhostInput
            type="number"
            value={character.initiative}
            onChange={(e) => onBasicInfoChange('initiative', parseInt(e.target.value) || 0)}
            className="h-6 w-12 text-center text-2xl font-bold"
          />
          <span className="text-muted-foreground mt-1 text-[9px] font-bold tracking-wider uppercase">
            {t('initiative')}
          </span>
        </div>
      </Card>

      {/* Speed */}
      <Card className="border-border bg-card/50 hover:bg-card col-span-2 flex flex-col items-center justify-center p-3 shadow-sm transition-colors md:col-span-1 lg:col-span-1">
        <div className="flex flex-col items-center gap-1">
          <Footprints className="mb-1 h-5 w-5 text-emerald-500 drop-shadow-sm" />
          <div className="flex items-baseline justify-center gap-1">
            <GhostInput
              type="number"
              value={character.speed || 30}
              onChange={(e) => onBasicInfoChange('speed', parseFloat(e.target.value) || 0)}
              className="h-6 w-12 text-center text-2xl font-bold"
            />
            <span className="text-muted-foreground text-xs">{t('speedUnit')}</span>
          </div>
          <span className="text-muted-foreground mt-1 text-[9px] font-bold tracking-wider uppercase">
            {t('speed')}
          </span>
        </div>
      </Card>
    </div>
  );
}
