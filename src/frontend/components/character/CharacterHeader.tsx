'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import ImageUpload from '@frontend/components/shared/ImageUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { Progress } from '@frontend/components/ui/progress';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { GhostInput } from '../ui/ghost-input';

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

const PREDEFINED_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
];

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
    <Card className="border-border bg-card overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
        <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
          <DialogTrigger asChild>
            <button className="group relative transition-transform hover:scale-105 active:scale-95">
              <Avatar className="border-character-muted shadow-character-muted h-20 w-20 shrink-0 border-2 shadow-md transition-all">
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback className="bg-muted text-xl font-bold">
                  {name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-full opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                <AppIcon name="Palette" size={24} className="text-character" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent
            className="character-context border-white/10 bg-slate-950/95 text-white backdrop-blur-xl sm:max-w-md"
            style={{ '--character-color': accentColor } as React.CSSProperties}
          >
            <DialogHeader>
              <DialogTitle>Personalizar Personagem</DialogTitle>
              <DialogDescription className="sr-only">
                {t('customizeDescription') || 'Altere o avatar e a cor de destaque do personagem'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <Label className="text-sm font-medium">Avatar</Label>
                <ImageUpload
                  currentUrl={avatarUrl}
                  target="character"
                  targetId={id}
                  onUploadSuccess={(url: string) => onBasicInfoChange('avatarUrl', url)}
                  size="lg"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-sm font-medium">Cor de Destaque</Label>
                <div className="grid grid-cols-5 gap-3">
                  {PREDEFINED_COLORS.map((color) => {
                    const isSelected =
                      color.value === accentColor || (!color.value && !accentColor);

                    return (
                      <button
                        key={color.name}
                        onClick={() => {
                          onBasicInfoChange('accentColor' as keyof DnD5eCharacter, color.value);
                        }}
                        className={cn(
                          'group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110',
                          isSelected
                            ? 'border-character ring-character/20 ring-2'
                            : 'border-transparent',
                        )}
                        title={color.name}
                      >
                        <div
                          className="h-7 w-7 rounded-full shadow-sm"
                          style={{ backgroundColor: color.value || 'var(--primary)' }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  useThemeColor={true}
                />
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-character flex h-10 items-center text-2xl leading-none font-black tracking-tight transition-colors">
                    {name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
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
                <Label
                  htmlFor="char-level"
                  className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
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
                  className="text-character-flare h-8 w-12 text-center font-bold"
                />
              </div>

              <div className="flex flex-1 items-center gap-2">
                <Label className="text-muted-foreground text-xs font-bold tracking-widest whitespace-nowrap uppercase opacity-70">
                  {t('proficiencyBonus')}
                </Label>
                <div className="border-border bg-muted/30 text-character flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 font-mono text-sm font-bold transition-colors">
                  +{pb}
                </div>
              </div>
            </div>

            {/* XP Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="char-xp"
                  className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
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
                    className="text-character-flare h-5 w-16 border-none bg-transparent p-0 text-right font-mono text-xs focus-visible:ring-0"
                  />
                  <span className="text-muted-foreground">/ {nextLevelXp}</span>
                </div>
              </div>
              <Progress
                value={progress}
                className="h-2"
                style={
                  { '--progress-foreground': 'var(--character-primary)' } as React.CSSProperties
                }
              />
            </div>
          </div>

          {/* Right Column: Information Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="char-race"
                className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
              >
                {t('race')}
              </Label>
              <div className="group relative">
                <GhostInput
                  id="char-race"
                  value={race || ''}
                  onChange={(e) => onBasicInfoChange('race', e.target.value)}
                  placeholder={t('race')}
                  className="bg-muted/10 group-hover:bg-muted/30 focus:bg-background h-10 border-b border-transparent px-3 font-medium transition-all focus:ring-0"
                  showIcon={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="char-class"
                className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
              >
                {t('class')}
              </Label>
              <div className="group relative">
                <GhostInput
                  id="char-class"
                  value={classNameStr || ''}
                  onChange={(e) => onBasicInfoChange('class', e.target.value)}
                  placeholder={t('class')}
                  className="bg-muted/10 group-hover:bg-muted/30 focus:bg-background h-10 border-b border-transparent px-3 transition-all focus:ring-0"
                  showIcon={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="char-background"
                className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
              >
                {t('background')}
              </Label>
              <div className="group relative">
                <GhostInput
                  id="char-background"
                  value={background || ''}
                  onChange={(e) => onBasicInfoChange('background', e.target.value)}
                  placeholder={t('background')}
                  className="bg-muted/10 group-hover:bg-muted/30 focus:bg-background h-10 border-b border-transparent px-3 font-medium transition-all focus:ring-0"
                  showIcon={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="char-alignment"
                className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-70"
              >
                {t('alignment')}
              </Label>
              <div className="group relative">
                <GhostInput
                  id="char-alignment"
                  value={alignment || ''}
                  onChange={(e) => onBasicInfoChange('alignment', e.target.value)}
                  placeholder={t('alignment')}
                  className="bg-muted/10 group-hover:bg-muted/30 focus:bg-background h-10 border-b border-transparent px-3 font-medium transition-all focus:ring-0"
                  showIcon={true}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(CharacterHeader);
