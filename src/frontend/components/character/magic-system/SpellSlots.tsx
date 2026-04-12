'use client';

import * as React from 'react';

import { Card } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  slots: Record<string, { max: number; used: number }>;
  onSlotsChange: (level: string, max: number, used: number) => void;
  systemSelector: React.ReactNode;
}

export const SpellSlots = React.forwardRef<HTMLDivElement, Props>(
  ({ slots, onSlotsChange, systemSelector, className, ...props }, ref) => {
    const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const activeLevels = allLevels.filter((lvl) => (slots[lvl.toString()]?.max || 0) > 0);

    const totalMax = activeLevels.reduce((acc, lvl) => acc + (slots[lvl.toString()]?.max || 0), 0);
    const totalUsed = activeLevels.reduce(
      (acc, lvl) => acc + (slots[lvl.toString()]?.used || 0),
      0,
    );
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
        ref={ref}
        className={cn(
          'group border-border bg-card/50 hover:bg-card relative flex min-h-[160px] flex-col justify-between overflow-hidden p-3 shadow-sm transition-colors',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
            <AppIcon name="crystal-ball" variant="game" size="lg" className="text-blue-400" />
            {systemSelector}
          </div>
          <div className="bg-character-surface text-blue-flare rounded-full px-2 py-0.5 text-xs font-bold tracking-widest uppercase">
            {totalAvailable} / {totalMax}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-x-1 gap-y-3">
          {allLevels.map((lvl) => {
            const slotData = slots[lvl.toString()];
            const isActive = (slotData?.max || 0) > 0;
            const available = Math.max(0, (slotData?.max || 0) - (slotData?.used || 0));

            return (
              <div key={lvl} className={cn('flex flex-col gap-0.5', !isActive && 'opacity-10')}>
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70">
                  {lvl}º
                </span>
                <div className="flex flex-wrap gap-1">
                  {isActive ? (
                    Array.from({ length: slotData.max }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          handleSlotToggle(
                            lvl.toString(),
                            slotData.used,
                            slotData.max,
                            i < available,
                          )
                        }
                        className={cn(
                          'h-2 w-2 rounded-[1px] transition-all duration-300',
                          i < available ? '' : 'bg-transparent',
                        )}
                        style={
                          i < available
                            ? {
                                backgroundColor: 'var(--blue-flare)',
                                boxShadow: '0 0 8px var(--blue-glow)',
                              }
                            : {
                                border: '1px solid var(--blue-muted)',
                              }
                        }
                      />
                    ))
                  ) : (
                    <div
                      className="h-2 w-2 rounded-[1px]"
                      style={{
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  },
);

SpellSlots.displayName = 'SpellSlots';
