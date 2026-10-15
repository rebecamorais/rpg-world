'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberInput } from '@frontend/components/ui/number-input';
import { cn } from '@frontend/lib/utils';

interface Props extends React.ComponentProps<'div'> {
  current: number;
  max: number;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  systemSelector: React.ReactNode;
}

export function SpellPoints({
  current,
  max,
  onPointsChange,
  systemSelector,
  className,
  ...props
}: Props) {
  const t = useTranslations('magicSystem');
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <Card
      className={cn(
        'group bg-background/60 hover:border-info-muted relative flex min-h-[160px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <AppIcon name="Droplet" size={14} className="text-info-flare" aria-hidden="true" />
        {systemSelector}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-1">
        <div className="flex items-baseline justify-center gap-1.5 font-bold">
          <div className="group/value relative flex items-baseline">
            <NumberInput
              ghost
              aria-label={t('spellPoints')}
              value={current}
              min={0}
              max={10_000}
              onValueChange={(next) => onPointsChange('current', next)}
              showIcon={false}
              className="text-foreground h-auto w-16 p-0 text-center font-mono text-3xl font-bold tabular-nums md:text-3xl"
            />
          </div>

          <div className="flex items-baseline gap-1 font-bold">
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-muted-foreground font-mono text-sm tabular-nums">{max}</span>
          </div>
        </div>

        <div className="border-border bg-muted relative mt-2 h-2 w-full overflow-hidden rounded-full border">
          <div
            className="from-info-muted to-info-flare absolute top-0 left-0 h-full bg-gradient-to-r shadow-[0_0_10px_var(--info-muted)] transition-all duration-500 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
