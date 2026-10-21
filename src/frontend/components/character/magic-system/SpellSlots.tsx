'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface Props extends React.ComponentProps<'div'> {
  slots: Record<string, { max: number; used: number }>;
  onSlotsChange: (level: string, max: number, used: number) => void;
  systemLabel: React.ReactNode;
  action?: React.ReactNode;
}

export function SpellSlots({
  slots,
  onSlotsChange,
  systemLabel,
  action,
  className,
  ...props
}: Props) {
  const t = useTranslations('magicSystem');
  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const activeLevels = allLevels.filter((lvl) => (slots[lvl.toString()]?.max || 0) > 0);

  const totalMax = activeLevels.reduce((acc, lvl) => acc + (slots[lvl.toString()]?.max || 0), 0);
  const totalUsed = activeLevels.reduce((acc, lvl) => acc + (slots[lvl.toString()]?.used || 0), 0);
  const totalAvailable = Math.max(0, totalMax - totalUsed);

  const handleSlotToggle = (
    levelStr: string,
    currentUsed: number,
    totalMax: number,
    increase: boolean,
  ) => {
    let newUsed = increase ? currentUsed + 1 : currentUsed - 1;
    if (newUsed < 0) newUsed = 0;
    if (newUsed > totalMax) newUsed = totalMax;
    onSlotsChange(levelStr, totalMax, newUsed);
  };

  return (
    <Card
      className={cn(
        'group bg-background/60 hover:border-info-muted relative flex min-h-[160px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <AppIcon
            name="crystal-ball"
            variant="game"
            size="lg"
            className="text-info-flare"
            aria-hidden="true"
          />
          {systemLabel}
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-info-surface text-info-flare rounded-full px-2 py-0.5 font-mono text-xs font-bold tabular-nums">
            {totalAvailable} / {totalMax}
          </div>
          {action}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-x-1 gap-y-3">
        {allLevels.map((lvl) => {
          const slotData = slots[lvl.toString()];
          const isActive = (slotData?.max || 0) > 0;
          const available = Math.max(0, (slotData?.max || 0) - (slotData?.used || 0));

          return (
            <div key={lvl} className={cn('flex flex-col gap-0.5', !isActive && 'opacity-30')}>
              <span className="text-label text-muted-foreground">{lvl}º</span>
              <div className="flex flex-wrap gap-1">
                {isActive ? (
                  Array.from({ length: slotData.max }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={t('slot', { level: lvl, slot: i + 1 })}
                      aria-pressed={i < available}
                      onClick={() =>
                        handleSlotToggle(lvl.toString(), slotData.used, slotData.max, i < available)
                      }
                      className={cn(
                        'focus-ring touch-target h-2 w-2 rounded-[1px] transition-all duration-300',
                        i < available
                          ? 'bg-info-flare shadow-[0_0_8px_var(--info-muted)]'
                          : 'border-info-muted border bg-transparent',
                      )}
                    />
                  ))
                ) : (
                  <div className="border-info-muted h-2 w-2 rounded-[1px] border" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
