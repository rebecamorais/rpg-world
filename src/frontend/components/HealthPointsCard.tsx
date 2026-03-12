'use client';

import * as React from 'react';

import { Heart, Skull } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { HealthBar } from '@frontend/components/ui/health-bar';
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
      <Heart className="h-3.5 w-3.5 text-red-500" />
      <span className="text-sm font-bold tracking-[0.2em] text-red-500/80 uppercase">
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
  <div className="flex flex-1 flex-col justify-center gap-1">
    <div className="flex items-baseline gap-1.5">
      <div className="group/value relative flex items-baseline">
        <GhostInput
          type="number"
          value={currentHp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onHpChange('hpCurrent', parseInt(e.target.value) || 0)
          }
          className="h-auto w-16 p-0 text-left text-2xl font-black text-white outline-none"
        />
      </div>

      <div className="flex items-baseline gap-1 font-bold">
        <span className="text-muted-foreground text-sm opacity-40">/</span>
        <span className="text-muted-foreground text-sm opacity-40">{maxHp}</span>
      </div>

      <div className="group/temp relative ml-2 flex items-baseline text-yellow-500">
        <span className="text-sm font-black opacity-50">(+</span>
        <GhostInput
          type="number"
          value={tempHp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onHpChange('hpTemp', parseInt(e.target.value) || 0)
          }
          className="h-auto w-10 p-0 text-left text-sm font-black text-yellow-500 outline-none"
        />
        <span className="text-sm font-black opacity-50">)</span>
      </div>
    </div>

    <HealthBar current={currentHp ?? 0} max={maxHp || 1} temp={tempHp ?? 0} className="mt-1" />
  </div>
);

const DeathSaves = () => {
  const [successes, setSuccesses] = React.useState(0);
  const [failures, setFailures] = React.useState(0);

  const toggleSuccess = (index: number) => {
    if (successes === index + 1) {
      setSuccesses(index);
    } else {
      setSuccesses(index + 1);
    }
  };

  const toggleFailure = (index: number) => {
    if (failures === index + 1) {
      setFailures(index);
    } else {
      setFailures(index + 1);
    }
  };

  return (
    <div className="border-border/40 mt-2 flex items-center justify-center border-t pt-2 opacity-60 transition-opacity group-hover:opacity-100">
      <div className="flex items-center gap-4">
        {/* Successes (Green) */}
        <div className="flex gap-1.5">
          {[2, 1, 0].map((i) => (
            <button
              key={`succ-${i}`}
              onClick={() => toggleSuccess(i)}
              className={cn(
                'h-3 w-3 rounded-full border transition-all',
                successes > i
                  ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  : 'border-emerald-500/40',
              )}
            />
          ))}
        </div>

        <Skull
          className="h-4 w-4 cursor-pointer text-white/80 transition-colors hover:text-white"
          onClick={() => {
            setSuccesses(0);
            setFailures(0);
          }}
        />

        {/* Failures (Red) */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={`fail-${i}`}
              onClick={() => toggleFailure(i)}
              className={cn(
                'h-3 w-3 rounded-full border transition-all',
                failures > i
                  ? 'border-red-500 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  : 'border-red-500/40',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const HealthPointsCard = React.forwardRef<HTMLDivElement, HealthPointsCardProps>(
  ({ currentHp, maxHp, tempHp, onHpChange, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'group border-border bg-card/50 hover:bg-card relative flex min-h-[160px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors',
          className,
        )}
        {...props}
      >
        <HealthHeader />
        <HealthValues currentHp={currentHp} maxHp={maxHp} tempHp={tempHp} onHpChange={onHpChange} />
        <DeathSaves />
      </Card>
    );
  },
);

HealthPointsCard.displayName = 'HealthPointsCard';
