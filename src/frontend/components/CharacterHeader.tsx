'use client';

import { useState } from 'react';

import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { Progress } from '@frontend/components/ui/progress';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

interface Props {
  name: string;
  classNameStr: string;
  level: number;
  race: string;
  pb: number;
  background?: string;
  alignment?: string;
  xp?: number;
  avatarUrl?: string;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
}

export default function CharacterHeader({
  name,
  classNameStr,
  level,
  race,
  pb,
  background,
  alignment,
  xp = 0,
  avatarUrl,
  onBasicInfoChange,
}: Props) {
  const t = useTranslations('characterHeader');
  const [isEditingName, setIsEditingName] = useState(false);

  // Simple XP progress calculation
  const xpThresholds = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000,
    165000, 195000, 225000, 265000, 305000, 355000,
  ];
  const currentLevelXp = xpThresholds[level - 1] || 0;
  const nextLevelXp = xpThresholds[level] || xpThresholds[xpThresholds.length - 1];
  const progress = Math.min(
    100,
    Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  );

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="flex items-center gap-6 p-6">
        {/* Avatar Section */}
        <Avatar className="border-primary/20 h-24 w-24 shrink-0 border-2 shadow-xl">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-muted text-2xl font-bold">
            {name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info Snapshot */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Row 1: Name & PB */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isEditingName ? (
                <GhostInput
                  autoFocus
                  value={name || ''}
                  onChange={(e) => onBasicInfoChange('name', e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="h-10 text-2xl font-bold tracking-tight"
                  containerClassName="w-full max-w-md"
                  showIcon={false}
                />
              ) : (
                <div className="group flex items-center gap-2 overflow-hidden">
                  <h1 className="text-foreground truncate text-2xl font-bold tracking-tight">
                    {name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-primary/10 text-primary border-primary/20 flex shrink-0 items-center rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase">
              {t('proficiencyBonus')}: <span className="ml-1">+{pb}</span>
            </div>
          </div>

          {/* Row 2: Stats (Class, Level, Race, etc.) */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <GhostInput
                value={classNameStr || ''}
                onChange={(e) => onBasicInfoChange('class', e.target.value)}
                className="text-foreground w-20 font-semibold"
                placeholder={t('class')}
              />
              <span className="shrink-0 text-xs opacity-70">{t('level')}</span>
              <GhostInput
                type="number"
                min={1}
                max={20}
                value={level || 1}
                onChange={(e) => onBasicInfoChange('level', parseInt(e.target.value) || 1)}
                className="w-8"
                showIcon={false}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0 opacity-70">{t('race')}:</span>
              <GhostInput
                value={race || ''}
                onChange={(e) => onBasicInfoChange('race', e.target.value)}
                className="text-foreground w-24 font-medium"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0 opacity-70">{t('background')}:</span>
              <GhostInput
                value={background || ''}
                onChange={(e) => onBasicInfoChange('background', e.target.value)}
                className="text-foreground w-28 font-medium"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0 opacity-70">{t('alignment')}:</span>
              <GhostInput
                value={alignment || ''}
                onChange={(e) => onBasicInfoChange('alignment', e.target.value)}
                className="text-foreground w-28 font-medium"
              />
            </div>
          </div>

          {/* Row 3: XP Bar */}
          <div className="mt-1 w-full max-w-sm">
            <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
              <div className="flex items-center gap-1">
                <span>{t('xp')}</span>
                <GhostInput
                  type="number"
                  min={0}
                  value={xp}
                  onChange={(e) => onBasicInfoChange('xp', parseInt(e.target.value) || 0)}
                  className="text-primary h-4 w-12 text-[10px]"
                  containerClassName="ml-1"
                  showIcon={false}
                />
              </div>
              <span className="shrink-0">/ {nextLevelXp} XP</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
