'use client';

import { useState } from 'react';

import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { Progress } from '@frontend/components/ui/progress';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { GhostInput } from './ui/ghost-input';

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
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
        <Avatar className="border-primary/20 h-20 w-20 shrink-0 border shadow-md">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-muted text-xl font-bold">
            {name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Core Stats */}
          <div className="flex flex-col gap-4">
            {/* Name Section */}
            <div className="flex flex-col gap-1.5">
              {isEditingName ? (
                <GhostInput
                  id="char-name"
                  autoFocus
                  value={name || ''}
                  onChange={(e) => onBasicInfoChange('name', e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="h-10 text-lg font-bold"
                />
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-foreground flex h-10 items-center text-2xl leading-none font-black tracking-tight">
                    {name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Level & PB Row */}
            <div className="flex items-center gap-6">
              <div className="flex shrink-0 items-center gap-2">
                <Label
                  htmlFor="char-level"
                  className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                >
                  {t('level')}
                </Label>
                <Input
                  id="char-level"
                  type="number"
                  min={1}
                  max={20}
                  value={level || 1}
                  onChange={(e) => onBasicInfoChange('level', parseInt(e.target.value) || 1)}
                  className="h-8 w-12 text-center font-bold"
                />
              </div>

              <div className="flex flex-1 items-center gap-2">
                <Label className="text-muted-foreground text-xs font-bold tracking-wider whitespace-nowrap uppercase">
                  {t('proficiencyBonus')}
                </Label>
                <div className="border-border bg-muted/30 flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 font-mono text-sm font-bold">
                  +{pb}
                </div>
              </div>
            </div>

            {/* XP Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="char-xp"
                  className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                >
                  {t('xp')}
                </Label>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Input
                    id="char-xp"
                    type="number"
                    min={0}
                    value={xp}
                    onChange={(e) => onBasicInfoChange('xp', parseInt(e.target.value) || 0)}
                    className="h-5 w-16 border-none bg-transparent p-0 text-right font-mono text-xs focus-visible:ring-0"
                  />
                  <span className="text-muted-foreground">/ {nextLevelXp}</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Right Column: Details List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Label
                htmlFor="char-race"
                className="text-muted-foreground w-20 shrink-0 text-xs font-bold tracking-wider uppercase"
              >
                {t('race')}
              </Label>
              <GhostInput
                id="char-race"
                value={race || ''}
                onChange={(e) => onBasicInfoChange('race', e.target.value)}
                placeholder={t('race')}
                className="h-8 flex-1"
                showIcon={true}
              />
            </div>

            <div className="flex items-center gap-3">
              <Label
                htmlFor="char-class"
                className="text-muted-foreground w-20 shrink-0 text-xs font-bold tracking-wider uppercase"
              >
                {t('class')}
              </Label>
              <GhostInput
                id="char-class"
                value={classNameStr || ''}
                onChange={(e) => onBasicInfoChange('class', e.target.value)}
                placeholder={t('class')}
                className="h-8 flex-1 font-semibold"
                showIcon={true}
              />
            </div>

            <div className="flex items-center gap-3">
              <Label
                htmlFor="char-background"
                className="text-muted-foreground w-20 shrink-0 text-xs font-bold tracking-wider uppercase"
              >
                {t('background')}
              </Label>
              <GhostInput
                id="char-background"
                value={background || ''}
                onChange={(e) => onBasicInfoChange('background', e.target.value)}
                placeholder={t('background')}
                className="h-8 flex-1"
                showIcon={true}
              />
            </div>

            <div className="flex items-center gap-3">
              <Label
                htmlFor="char-alignment"
                className="text-muted-foreground w-20 shrink-0 text-xs font-bold tracking-wider uppercase"
              >
                {t('alignment')}
              </Label>
              <GhostInput
                id="char-alignment"
                value={alignment || ''}
                onChange={(e) => onBasicInfoChange('alignment', e.target.value)}
                placeholder={t('alignment')}
                className="h-8 flex-1"
                showIcon={true}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
