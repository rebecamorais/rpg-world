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
    <div className="flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
      <AppIcon name="Heart" size={16} className="text-red-flare animate-pulse" />
      <span className="text-red-flare text-[10px] font-black tracking-[0.2em] uppercase">
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
  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
    <div className="flex items-center justify-center">
      <div className="flex items-baseline gap-1">
        <GhostInput
          type="number"
          value={currentHp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onHpChange('hpCurrent', parseInt(e.target.value) || 0)
          }
          className="h-auto w-20 p-0 text-right text-5xl font-black text-white drop-shadow-2xl outline-none"
        />
        <div className="flex items-baseline gap-1 self-end px-1 pb-1.5 font-bold">
          <span className="text-lg text-white/20">/</span>
          <span className="text-lg text-white/40">{maxHp}</span>
        </div>
      </div>

      {tempHp > 0 && (
        <div className="text-yellow ml-2 flex items-baseline self-end pb-2 font-black transition-all duration-300">
          <span className="text-xs opacity-40">(+</span>
          <GhostInput
            type="number"
            value={tempHp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onHpChange('hpTemp', parseInt(e.target.value) || 0)
            }
            className="text-yellow h-auto w-8 p-0 text-center text-xs font-black outline-none"
          />
          <span className="text-xs opacity-40">)</span>
        </div>
      )}
    </div>

    <HealthBar
      current={currentHp ?? 0}
      max={maxHp || 1}
      temp={tempHp ?? 0}
      className="mt-4 w-full px-2"
    />
  </div>
);

export const HealthPointsCard = React.forwardRef<HTMLDivElement, HealthPointsCardProps>(
  ({ currentHp, maxHp, tempHp, onHpChange, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'group hover:border-red/30 relative flex min-h-[160px] flex-col justify-between overflow-hidden border-zinc-800/40 bg-zinc-950/40 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:bg-zinc-900/60',
          className,
        )}
        {...props}
      >
        {/* Background glow matching HP state */}
        <div className="bg-red/5 absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl transition-opacity group-hover:opacity-20" />

        <HealthHeader />
        <HealthValues currentHp={currentHp} maxHp={maxHp} tempHp={tempHp} onHpChange={onHpChange} />
      </Card>
    );
  },
);

HealthPointsCard.displayName = 'HealthPointsCard';
