'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { FieldLabel, InlineField } from '@frontend/components/ui/field';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberStepper } from '@frontend/components/ui/number-stepper';
import { Progress } from '@frontend/components/ui/progress';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { GhostInput } from '../ui/ghost-input';
import { CharacterCustomizationDialog } from './CharacterCustomizationDialog';

interface Props {
  id: string;
  name: string;
  classNameStr: string;
  level: number;
  race: string;
  pb: number;
  background?: string;
  alignment?: string;
  xp?: number;
  avatarUrl?: string;
  accentColor?: string;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
}

function CharacterHeader({
  id,
  name,
  classNameStr,
  level,
  race,
  pb,
  background,
  alignment,
  xp = 0,
  avatarUrl,
  accentColor,
  onBasicInfoChange,
}: Props) {
  const t = useTranslations('characterHeader');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

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
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
        <button
          type="button"
          onClick={() => setIsColorPickerOpen(true)}
          aria-label={t('customizeTitle')}
          className="group focus-ring relative self-start rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <Avatar className="border-character-muted shadow-character-muted h-20 w-20 shrink-0 border-2 shadow-md transition-all">
            <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            <AvatarFallback className="bg-muted text-xl font-bold">
              {name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-full opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <AppIcon name="Palette" size={24} className="text-character-flare" />
          </div>
        </button>

        <CharacterCustomizationDialog
          id={id}
          avatarUrl={avatarUrl}
          accentColor={accentColor}
          onBasicInfoChange={onBasicInfoChange}
          open={isColorPickerOpen}
          onOpenChange={setIsColorPickerOpen}
        />

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
                  className="text-title md:text-title text-character-flare h-10"
                />
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-title text-character-flare flex min-h-10 items-center">
                    {name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('editName')}
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setIsEditingName(true)}
                  >
                    <AppIcon name="Pencil" size={12} />
                  </Button>
                </div>
              )}
            </div>

            {/* Level & PB Row */}
            <div className="flex items-center gap-6">
              <div className="flex shrink-0 items-center gap-2">
                <FieldLabel htmlFor="char-level">{t('level')}</FieldLabel>
                <NumberStepper
                  id="char-level"
                  min={1}
                  max={20}
                  value={level || 1}
                  onChange={(val) => onBasicInfoChange('level', val)}
                  size="sm"
                  containerClassName="py-0 gap-2"
                />
              </div>

              <div className="flex flex-1 items-center gap-2">
                <span className="text-label text-muted-foreground whitespace-nowrap">
                  {t('proficiencyBonus')}
                </span>
                <div className="bg-muted/40 text-character-flare flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono text-sm font-bold">
                  +{pb}
                </div>
              </div>
            </div>

            {/* XP Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="char-xp">{t('xp')}</FieldLabel>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <GhostInput
                    id="char-xp"
                    type="number"
                    min={0}
                    value={xp}
                    onChange={(e) => onBasicInfoChange('xp', parseInt(e.target.value) || 0)}
                    className="text-character-flare h-5 w-16 text-right font-mono text-xs md:text-xs"
                  />
                  <span className="text-muted-foreground">/ {nextLevelXp}</span>
                </div>
              </div>
              <Progress
                aria-label={t('xpProgress')}
                value={progress}
                className="h-2"
                indicatorClassName="bg-character"
              />
            </div>
          </div>

          {/* Right Column: Information Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InlineField
              id="char-race"
              label={t('race')}
              value={race || ''}
              onChange={(e) => onBasicInfoChange('race', e.target.value)}
              placeholder={t('racePlaceholder')}
            />
            <InlineField
              id="char-class"
              label={t('class')}
              value={classNameStr || ''}
              onChange={(e) => onBasicInfoChange('class', e.target.value)}
              placeholder={t('classPlaceholder')}
            />
            <InlineField
              id="char-background"
              label={t('background')}
              value={background || ''}
              onChange={(e) => onBasicInfoChange('background', e.target.value)}
              placeholder={t('backgroundPlaceholder')}
            />
            <InlineField
              id="char-alignment"
              label={t('alignment')}
              value={alignment || ''}
              onChange={(e) => onBasicInfoChange('alignment', e.target.value)}
              placeholder={t('alignmentPlaceholder')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(CharacterHeader);
