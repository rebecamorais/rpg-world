'use client';

import { Footprints, Heart, HeartPulse, Shield, Swords } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';
import type { DnD5eCharacter } from '@/systems/dnd5e';

interface CombatStatsSectionProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (
    field: keyof DnD5eCharacter,
    value: string | number,
  ) => void;
}

export default function CombatStatsSection({
  character,
  onBasicInfoChange,
}: CombatStatsSectionProps) {
  const t = useTranslations('combatStats');

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
      {/* Classe Armadura */}
      <Card className="group border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
        <div className="z-10 flex flex-col items-center">
          <Shield className="text-primary mb-2 h-6 w-6 drop-shadow-md" />
          <Input
            type="number"
            value={character.ac ?? 0}
            onChange={(e) =>
              onBasicInfoChange('ac', parseInt(e.target.value) || 0)
            }
            className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
          />
          <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
            {t('armorClass')}
          </span>
        </div>
      </Card>

      {/* Pontos de Vida */}
      <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
        <div className="z-10 flex flex-col items-center">
          <Heart className="mb-2 h-6 w-6 text-red-500 drop-shadow-md" />
          <div className="flex items-baseline justify-center gap-1">
            <Input
              type="number"
              value={character.hpCurrent ?? 0}
              onChange={(e) =>
                onBasicInfoChange('hpCurrent', parseInt(e.target.value) || 0)
              }
              className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-right text-3xl font-bold focus-visible:ring-2"
            />
            <span className="text-muted-foreground">/</span>
            <Input
              type="number"
              value={character.hpMax ?? 0}
              onChange={(e) =>
                onBasicInfoChange('hpMax', parseInt(e.target.value) || 0)
              }
              className="focus-visible:ring-primary text-muted-foreground h-10 w-12 border-transparent bg-transparent p-0 text-left text-xl font-bold focus-visible:ring-2"
            />
          </div>
          <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
            {t('hitPoints')}
          </span>
        </div>
      </Card>

      {/* Vida Temporária */}
      <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
        <div className="z-10 flex flex-col items-center">
          <HeartPulse className="mb-2 h-6 w-6 text-yellow-500 drop-shadow-md" />
          <Input
            type="number"
            value={character.hpTemp ?? 0}
            onChange={(e) =>
              onBasicInfoChange('hpTemp', parseInt(e.target.value) || 0)
            }
            className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
          />
          <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
            {t('tempHp')}
          </span>
        </div>
      </Card>

      {/* Deslocamento */}
      <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
        <div className="z-10 flex flex-col items-center">
          <Footprints className="mb-2 h-6 w-6 text-emerald-500 drop-shadow-md" />
          <div className="flex items-baseline justify-center gap-1">
            <Input
              type="number"
              value={character.speed || 30}
              onChange={(e) =>
                onBasicInfoChange('speed', parseFloat(e.target.value) || 0)
              }
              className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
            />
            <span className="text-muted-foreground text-sm">
              {t('speedUnit')}
            </span>
          </div>
          <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
            {t('speed')}
          </span>
        </div>
      </Card>

      {/* Iniciativa */}
      <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
        <div className="z-10 flex flex-col items-center">
          <Swords className="mb-2 h-6 w-6 text-orange-500 drop-shadow-md" />
          <Input
            type="number"
            value={character.initiative}
            onChange={(e) =>
              onBasicInfoChange('initiative', parseInt(e.target.value) || 0)
            }
            className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
          />
          <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
            {t('initiative')}
          </span>
        </div>
      </Card>
    </div>
  );
}
