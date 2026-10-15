'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberInput } from '@frontend/components/ui/number-input';
import { cn } from '@frontend/lib/utils';

export interface HealthPointsCardProps extends React.ComponentProps<'div'> {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onHpChange: (field: 'hpCurrent' | 'hpMax' | 'hpTemp', value: number) => void;
}

/** hp_* columns are smallint. */
const SMALLINT_MAX = 32_767;

const HealthHeader = () => {
  const t = useTranslations('combatStats');
  return (
    <div className="flex items-center gap-2">
      <AppIcon name="Heart" size={16} className="text-danger-flare" aria-hidden="true" />
      <span className="text-label text-danger-flare">{t('hitPointsShort')}</span>
    </div>
  );
};

interface HealthValuesProps {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onHpChange: (field: 'hpCurrent' | 'hpMax' | 'hpTemp', value: number) => void;
}

const HealthValues = ({ currentHp, maxHp, tempHp, onHpChange }: HealthValuesProps) => {
  const t = useTranslations('combatStats');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t('loseHp')}
          onClick={() => onHpChange('hpCurrent', Math.max(0, currentHp - 1))}
          disabled={currentHp <= 0}
          className="h-9 w-9 rounded-full"
        >
          <AppIcon name="Minus" size={16} />
        </Button>
        <div className="flex items-baseline gap-1">
          <NumberInput
            ghost
            aria-label={t('hitPoints')}
            value={currentHp}
            min={0}
            max={SMALLINT_MAX}
            onValueChange={(next) => onHpChange('hpCurrent', next)}
            showIcon={false}
            className="text-foreground h-auto w-24 p-0 text-right font-mono text-5xl font-bold tabular-nums md:text-5xl"
          />
          <div className="flex items-baseline gap-1 self-end px-1 pb-1.5 font-bold">
            <span className="text-muted-foreground text-lg" aria-hidden="true">
              /
            </span>
            <span className="text-muted-foreground font-mono text-lg tabular-nums">{maxHp}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('gainHp')}
          onClick={() => onHpChange('hpCurrent', Math.min(maxHp, currentHp + 1))}
          disabled={currentHp >= maxHp}
          className="h-9 w-9 rounded-full"
        >
          <AppIcon name="Plus" size={16} />
        </Button>

        {tempHp > 0 && (
          <div className="text-warning-flare ml-2 flex items-baseline self-end pb-2 font-bold">
            <span className="text-xs">(+</span>
            <NumberInput
              ghost
              aria-label={t('tempHp')}
              value={tempHp}
              min={0}
              max={SMALLINT_MAX}
              onValueChange={(next) => onHpChange('hpTemp', next)}
              showIcon={false}
              className="text-warning-flare h-auto w-8 p-0 text-center font-mono text-xs font-bold md:text-xs"
            />
            <span className="text-xs">)</span>
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
};

export function HealthPointsCard({
  currentHp,
  maxHp,
  tempHp,
  onHpChange,
  className,
  ...props
}: HealthPointsCardProps) {
  return (
    <Card
      className={cn(
        'group hover:border-danger-muted bg-background/60 relative flex min-h-[160px] flex-col justify-between overflow-hidden p-4 shadow-sm transition-colors',
        className,
      )}
      {...props}
    >
      {/* Background glow matching HP state */}
      <div className="bg-danger-surface absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl" />

      <HealthHeader />
      <HealthValues currentHp={currentHp} maxHp={maxHp} tempHp={tempHp} onHpChange={onHpChange} />
    </Card>
  );
}
