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
    <Card className="border-border bg-card overflow-hidden shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar Section */}
        <Avatar className="border-primary/20 h-16 w-16 shrink-0 border shadow-md">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-muted font-bold">
            {name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info Snapshot */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {/* Row 1: Name & PB */}
          <div className="flex items-center gap-3">
            <div className="flex max-w-sm min-w-0 items-center gap-2">
              {isEditingName ? (
                <GhostInput
                  autoFocus
                  value={name || ''}
                  onChange={(e) => onBasicInfoChange('name', e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="h-8 text-xl font-bold tracking-tight"
                  containerClassName="w-full flex-1"
                />
              ) : (
                <div className="group flex items-center gap-1 overflow-hidden">
                  <h1 className="text-foreground truncate text-xl font-bold tracking-tight">
                    {name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-secondary text-secondary-foreground flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold opacity-80">
              {t('proficiencyBonus')}: <span className="ml-1">+{pb}</span>
            </div>
          </div>

          {/* Row 2: Secondary Info (Class, Race, BG, Align) */}
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <div className="flex items-center">
              <GhostInput
                value={classNameStr || ''}
                onChange={(e) => onBasicInfoChange('class', e.target.value)}
                className="text-foreground h-5 w-20 text-xs font-semibold"
                placeholder={t('class')}
              />
              <span className="mx-1 opacity-50">{t('level')}</span>
              <GhostInput
                type="number"
                min={1}
                max={20}
                value={level || 1}
                onChange={(e) => onBasicInfoChange('level', parseInt(e.target.value) || 1)}
                className="text-foreground h-5 w-8 text-xs font-semibold"
              />
            </div>
            <span className="mx-1 opacity-30">•</span>
            <div className="flex items-center">
              <GhostInput
                value={race || ''}
                onChange={(e) => onBasicInfoChange('race', e.target.value)}
                className="h-5 w-20 text-xs font-medium"
                placeholder={t('race')}
              />
            </div>
            <span className="mx-1 opacity-30">•</span>
            <div className="flex items-center">
              <GhostInput
                value={background || ''}
                onChange={(e) => onBasicInfoChange('background', e.target.value)}
                className="h-5 w-24 text-xs font-medium"
                placeholder={t('background')}
              />
            </div>
            <span className="mx-1 opacity-30">•</span>
            <div className="flex items-center">
              <GhostInput
                value={alignment || ''}
                onChange={(e) => onBasicInfoChange('alignment', e.target.value)}
                className="h-5 w-24 text-xs font-medium"
                placeholder={t('alignment')}
              />
            </div>
          </div>

          {/* Row 3: XP Bar (Super compact) */}
          <div className="mt-1 flex w-full max-w-xs items-center gap-2">
            <span className="text-muted-foreground text-[9px] font-bold uppercase">{t('xp')}</span>
            <Progress value={progress} className="h-1.5 flex-1 opacity-60" />
            <div className="text-muted-foreground flex items-center text-[9px] font-medium">
              <GhostInput
                type="number"
                min={0}
                value={xp}
                onChange={(e) => onBasicInfoChange('xp', parseInt(e.target.value) || 0)}
                className="h-4 w-12 p-0 text-right text-[9px]"
              />
              <span className="ml-0.5">/ {nextLevelXp}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
