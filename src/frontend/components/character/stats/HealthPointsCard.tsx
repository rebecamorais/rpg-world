'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

export interface HealthPointsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onHpChange: (field: 'hpCurrent' | 'hpMax' | 'hpTemp', value: number) => void;
}

const HealthHeader = () => {
  const t = useTranslations('combatStats');
  return (
    <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
      <AppIcon name="Heart" size={14} className="text-red" />
      <span className="text-red-flare text-xs font-bold tracking-widest uppercase">
        {t('hitPointsShort')}
      </span>
    </div>
  );
};

interface HealthValuesProps {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onHpChange: (field: 'hpCurrent' | 'hpMax' | 'hpTemp', value: number) => void;
}

const HealthValues = ({ currentHp, maxHp, tempHp, onHpChange }: HealthValuesProps) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-1 py-1">
    <div className="flex items-baseline justify-center gap-1.5">
      <div className="group/value relative flex items-baseline">
        <GhostInput
          type="number"
          value={currentHp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onHpChange('hpCurrent', parseInt(e.target.value) || 0)
          }
          className="h-auto w-16 p-0 text-center text-4xl font-black text-white outline-none"
        />
      </div>

      <div className="flex items-baseline gap-1 font-bold">
        <span className="text-muted-foreground text-sm opacity-30">/</span>
        <span className="text-muted-foreground text-sm opacity-30">{maxHp}</span>
      </div>

      {tempHp > 0 && (
        <div className="text-yellow ml-1 flex items-baseline">
          <span className="text-xs font-black opacity-50">(+</span>
          <GhostInput
            type="number"
            value={tempHp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onHpChange('hpTemp', parseInt(e.target.value) || 0)
            }
            className="text-yellow h-auto w-10 p-0 text-left text-xs font-black outline-none"
          />
          <span className="text-xs font-black opacity-50">)</span>
        </div>
      )}
    </div>

    <HealthBar current={currentHp ?? 0} max={maxHp || 1} temp={tempHp ?? 0} className="mt-2" />
  </div>
);

export const HealthPointsCard = React.forwardRef<HTMLDivElement, HealthPointsCardProps>(
  ({ currentHp, maxHp, tempHp, onHpChange, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'group border-border hover:border-border/60 relative flex min-h-[160px] flex-col justify-between overflow-hidden bg-zinc-950/20 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/40',
          className,
        )}
        {...props}
      >
        <HealthHeader />
        <HealthValues currentHp={currentHp} maxHp={maxHp} tempHp={tempHp} onHpChange={onHpChange} />
      </Card>
    );
  },
);

HealthPointsCard.displayName = 'HealthPointsCard';
