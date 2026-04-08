import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

export type MagicSystem = 'slots' | 'points';

export interface MagicSystemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  character: DnD5eCharacter;
  onSystemChange: (system: MagicSystem) => void;
  onPointsChange: (field: 'current' | 'max', value: number) => void;
  onSlotsChange: (level: string, max: number, used: number) => void;
}

export const MagicSystemCard = React.forwardRef<HTMLDivElement, MagicSystemCardProps>(
  ({ character, onSystemChange, onPointsChange, onSlotsChange, className, ...props }, ref) => {
    const t = useTranslations('magicSystem');
    const system = character.spellcastingSystem || 'points';

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

    const systemSelector = (
      <Select value={system} onValueChange={(val) => onSystemChange(val as MagicSystem)}>
        <SelectTrigger className="h-5 w-fit border-none bg-transparent p-0 text-xs font-bold tracking-widest text-zinc-400 uppercase shadow-none focus:ring-0">
          <SelectValue placeholder="Magic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="slots" className="text-sm">
            {t('spellSlots') || 'Spell Slots'}
          </SelectItem>
          <SelectItem value="points" className="text-sm">
            {t('spellPoints') || 'Spell Points'}
          </SelectItem>
        </SelectContent>
      </Select>
    );

    if (system === 'points') {
      const max = character.spellPoints?.max || 1;
      const current = character.spellPoints?.current || 0;
      const percentage = Math.min(100, Math.max(0, (current / max) * 100));

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
            <AppIcon name="Droplet" size={14} className="text-blue-500" />
            {systemSelector}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-1">
            <div className="flex items-baseline justify-center gap-1.5 font-bold">
              <div className="group/value relative flex items-baseline">
                <GhostInput
                  type="number"
                  value={current}
                  onChange={(e) => onPointsChange('current', parseInt(e.target.value) || 0)}
                  className="h-auto w-16 p-0 text-center text-3xl font-black text-white outline-none"
                />
              </div>

              <div className="flex items-baseline gap-1 font-bold">
                <span className="text-muted-foreground text-sm opacity-30">/</span>
                <span className="text-muted-foreground text-sm opacity-30">{max}</span>
              </div>
            </div>

            <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full border border-white/5 bg-zinc-900/50">
              <div
                className="absolute top-0 left-0 h-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(to right, var(--character-muted), var(--character-flare))`,
                  boxShadow: '0 0 10px var(--character-glow)',
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1),transparent)]" />
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (system === 'slots') {
      const slots = character.spellSlots || {};
      const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const activeLevels = allLevels.filter((lvl) => (slots[lvl.toString()]?.max || 0) > 0);

      const totalMax = activeLevels.reduce(
        (acc, lvl) => acc + (slots[lvl.toString()]?.max || 0),
        0,
      );
      const totalUsed = activeLevels.reduce(
        (acc, lvl) => acc + (slots[lvl.toString()]?.used || 0),
        0,
      );
      const totalAvailable = Math.max(0, totalMax - totalUsed);

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
              <AppIcon name="Wand2" size={14} className="text-blue-400" />
              {systemSelector}
            </div>
            <div className="bg-character-surface text-character-flare rounded-full px-2 py-0.5 text-xs font-bold tracking-widest uppercase">
              {totalAvailable} / {totalMax} Slots
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
                                  backgroundColor: 'var(--character-flare)',
                                  boxShadow: '0 0 8px var(--character-glow)',
                                }
                              : {
                                  border: '1px solid var(--character-muted)',
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
    }
  },
);
MagicSystemCard.displayName = 'MagicSystemCard';
