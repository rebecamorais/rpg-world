import * as React from 'react';

import { Heart, Pencil, Star } from 'lucide-react';
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
        <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-red-500/80 uppercase">
            HP
          </span>
        </div>

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
              <Pencil className="absolute top-1 -right-4 h-3 w-3 opacity-0 transition-opacity group-hover/value:opacity-50" />
            </div>

            <div className="flex items-baseline gap-1 font-bold">
              <span className="text-muted-foreground text-sm opacity-40">/</span>
              <span className="text-muted-foreground text-sm opacity-40">{maxHp}</span>
            </div>

            {tempHp > 0 && <span className="text-sm font-black text-yellow-500">(+{tempHp})</span>}
          </div>

          <HealthBar
            current={currentHp ?? 0}
            max={maxHp || 1}
            temp={tempHp ?? 0}
            className="mt-1"
          />
        </div>

        {/* HUD Bottom Bar: Hit Dice & Death Saves */}
        <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-3 opacity-60 transition-opacity group-hover:opacity-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Hit Dice
            </span>
            <span className="text-sm leading-none font-bold text-white">1d10</span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-muted-foreground text-[10px] leading-none font-bold tracking-wider uppercase">
              Death Saves
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    i === 1
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'border border-red-500/30',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  },
);

HealthPointsCard.displayName = 'HealthPointsCard';
