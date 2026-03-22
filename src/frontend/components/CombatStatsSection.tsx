'use client';

import {
  Dices,
  Footprints,
  Heart,
  Minus,
  Plus,
  Settings2,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { HealthPointsCard } from '@frontend/components/HealthPointsCard';
import { MagicSystem, MagicSystemCard } from '@frontend/components/MagicSystemCard';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

function NumberStepper({ value, onChange, min = 0, max = 99, label }: NumberStepperProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span
        className={cn(
          'text-sm font-bold uppercase transition-opacity',
          value === 0 ? 'opacity-40' : 'opacity-80',
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm p-0 transition-colors hover:bg-zinc-800"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm font-bold">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm p-0 transition-colors hover:bg-zinc-800"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface CombatStatsSectionProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
  onHitDiceChange: (total: string) => void;
}

interface StatBadgeProps {
  icon: React.ReactNode;
  label?: string;
  children: React.ReactNode;
  reverse?: boolean;
}

const StatBadge = ({ icon, label, children, reverse }: StatBadgeProps) => (
  <div className="group/badge border-border/40 hover:border-primary/30 flex items-center gap-4 rounded-full border bg-zinc-950/40 px-3 py-1 backdrop-blur-md transition-all duration-300 hover:bg-zinc-900/60 hover:shadow-[0_0_15px_rgba(var(--primary),0.05)]">
    <div className="text-muted-foreground/50 group-hover/badge:text-primary transition-colors duration-300">
      {icon}
    </div>
    <div className={cn('flex items-baseline gap-2', reverse && 'flex-row-reverse')}>
      {label && (
        <span className="text-muted-foreground/50 text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-opacity group-hover/badge:opacity-100">
          {label}
        </span>
      )}
      <div className="transition-colors duration-300 group-hover/badge:text-white">{children}</div>
    </div>
  </div>
);

interface CombatHeaderProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
}

const CombatHeader = ({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
}: CombatHeaderProps) => {
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const tcommon = useTranslations('common');

  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-muted-foreground text-sm font-bold tracking-[0.2em] uppercase">
        {t('status') || 'Combat Status'}
      </h3>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="border-border/30 hover:bg-secondary/50 hover:border-border/60 hover:text-primary h-7 w-7 rounded-md border bg-transparent transition-all"
          >
            <Settings2 className="text-muted-foreground/60 h-3.5 w-3.5 transition-colors group-hover:text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="border-zinc-800 bg-zinc-950 p-0 sm:max-w-[700px]">
          <DialogHeader className="border-b border-zinc-800 p-6 pb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-zinc-400" />
              <DialogTitle className="text-zinc-100">
                {tm('titleConfig') || 'Combat Configuration'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 divide-zinc-800 md:grid-cols-2 md:divide-x">
            {/* Left Column: HP & Survival */}
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-center gap-2 pb-2">
                <Heart className="h-4 w-4 text-red-500" />
                <h4 className="text-sm font-black tracking-widest text-zinc-400 uppercase">
                  {t('hitPoints') || 'Hit Points'}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hpMax" className="text-sm font-bold text-zinc-500 uppercase">
                    {t('hitPoints')} Max
                  </Label>
                  <Input
                    id="hpMax"
                    type="number"
                    value={character.hpMax}
                    onChange={(e) => onBasicInfoChange('hpMax', parseInt(e.target.value) || 0)}
                    className="h-9 border-zinc-800 bg-zinc-900 transition-colors focus:border-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Magic System */}
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-center gap-2 pb-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-black tracking-widest text-zinc-400 uppercase">
                  {tm('systemUsed') || 'Magic System'}
                </h4>
              </div>

              <Tabs
                value={character.spellcastingSystem || 'none'}
                onValueChange={(val) => onSpellcastingSystemChange(val as MagicSystem)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 border border-zinc-800 bg-zinc-900 p-1">
                  <TabsTrigger
                    value="slots"
                    className="h-7 text-sm font-bold uppercase data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
                  >
                    {tm('spellSlots')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="points"
                    className="h-7 text-sm font-bold uppercase data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
                  >
                    {tm('spellPoints')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slots" className="mt-4 space-y-1">
                  <Label className="mb-2 block text-sm font-bold text-zinc-500 uppercase">
                    {tm('slotsCapacity')}
                  </Label>
                  <div className="custom-scrollbar max-h-[220px] overflow-y-auto pr-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                      <NumberStepper
                        key={lvl}
                        label={tm('circle', { level: lvl }) || `${lvl}º Círculo`}
                        value={character.spellSlots?.[lvl.toString()]?.max || 0}
                        onChange={(val) =>
                          onSpellSlotsChange(
                            lvl.toString(),
                            val,
                            character.spellSlots?.[lvl.toString()]?.used || 0,
                          )
                        }
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="points" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-zinc-500 uppercase">
                      {tm('pointsCapacity')}
                    </Label>
                    <Input
                      type="number"
                      value={character.spellPoints?.max || 0}
                      onChange={(e) => onSpellPointsChange('max', parseInt(e.target.value) || 0)}
                      className="h-9 border-zinc-800 bg-zinc-900 transition-colors focus:border-zinc-700"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 bg-zinc-900/50 p-6 md:flex-row">
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 text-sm font-bold text-zinc-400 uppercase hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    {tcommon('cancel') || 'Cancel'}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button className="h-9 bg-zinc-100 px-6 text-sm font-bold text-zinc-950 uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-zinc-200">
                    {tcommon('save') || 'Save'}
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ResourceGridProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onSpellcastingSystemChange: (system: MagicSystem) => void;
  onSpellPointsChange: (field: 'current' | 'max', value: number) => void;
  onSpellSlotsChange: (level: string, max: number, used: number) => void;
}

const ResourceGrid = ({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
}: ResourceGridProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <HealthPointsCard
      currentHp={character.hpCurrent ?? 0}
      maxHp={character.hpMax || 1}
      tempHp={character.hpTemp ?? 0}
      onHpChange={(field, value) => onBasicInfoChange(field, value)}
    />

    <MagicSystemCard
      character={character}
      onSystemChange={onSpellcastingSystemChange}
      onPointsChange={onSpellPointsChange}
      onSlotsChange={onSpellSlotsChange}
    />
  </div>
);

interface BadgeRowProps {
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  onHitDiceChange: (total: string) => void;
}

const BadgeRow = ({ character, onBasicInfoChange, onHitDiceChange }: BadgeRowProps) => {
  const t = useTranslations('combatStats');

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {/* Armor Class */}
      <StatBadge icon={<Shield className="text-primary h-3.5 w-3.5" />} label={t('armorClass')}>
        <GhostInput
          type="number"
          value={character.ac ?? 0}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onBasicInfoChange('ac', parseInt(e.target.value) || 0)
          }
          className="h-auto w-12 p-0 text-left text-sm font-bold"
        />
      </StatBadge>

      {/* Initiative */}
      <StatBadge icon={<Swords className="h-3.5 w-3.5 text-orange-500" />} label={t('initiative')}>
        <GhostInput
          type="number"
          value={character.initiative}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onBasicInfoChange('initiative', parseInt(e.target.value) || 0)
          }
          className="h-auto w-12 p-0 text-left text-sm font-bold"
        />
      </StatBadge>

      {/* Speed */}
      <StatBadge
        icon={<Footprints className="h-3.5 w-3.5 text-emerald-500" />}
        label={t('speedUnit')}
        reverse
      >
        <GhostInput
          type="number"
          value={character.speed || 30}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onBasicInfoChange('speed', parseFloat(e.target.value) || 0)
          }
          className="h-auto w-12 p-0 text-left text-sm font-bold"
        />
      </StatBadge>

      {/* Hit Dice */}
      <StatBadge icon={<Dices className="h-3.5 w-3.5 text-sky-400" />} label={t('hitDiceShort')}>
        <Select
          value={character.hitDice?.total || '1d8'}
          onValueChange={(val) => onHitDiceChange(val)}
        >
          <SelectTrigger className="h-auto border-none bg-transparent p-0 text-sm font-bold shadow-none focus:ring-0 [&>span]:line-clamp-none">
            <SelectValue placeholder="1d8" />
          </SelectTrigger>
          <SelectContent className="min-w-[70px]">
            {['d6', 'd8', 'd10', 'd12'].map((key) => (
              <SelectItem key={key} value={`1${key}`} className="text-xs font-bold">
                {t(`diceOptions.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </StatBadge>
    </div>
  );
};

export default function CombatStatsSection({
  character,
  onBasicInfoChange,
  onSpellcastingSystemChange,
  onSpellPointsChange,
  onSpellSlotsChange,
  onHitDiceChange,
}: CombatStatsSectionProps) {
  return (
    <div className="flex flex-col">
      <CombatHeader
        character={character}
        onBasicInfoChange={onBasicInfoChange}
        onSpellcastingSystemChange={onSpellcastingSystemChange}
        onSpellPointsChange={onSpellPointsChange}
        onSpellSlotsChange={onSpellSlotsChange}
      />

      <ResourceGrid
        character={character}
        onBasicInfoChange={onBasicInfoChange}
        onSpellcastingSystemChange={onSpellcastingSystemChange}
        onSpellPointsChange={onSpellPointsChange}
        onSpellSlotsChange={onSpellSlotsChange}
      />

      <BadgeRow
        character={character}
        onBasicInfoChange={onBasicInfoChange}
        onHitDiceChange={onHitDiceChange}
      />
    </div>
  );
}
