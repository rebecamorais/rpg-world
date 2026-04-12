'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import ImageUpload from '@frontend/components/shared/ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Label } from '@frontend/components/ui/label';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

export const PREDEFINED_COLORS = [
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

interface CharacterCustomizationDialogProps {
  id: string;
  avatarUrl?: string;
  accentColor?: string;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string | number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterCustomizationDialog({
  id,
  avatarUrl,
  accentColor,
  onBasicInfoChange,
  open,
  onOpenChange,
}: CharacterCustomizationDialogProps) {
  const t = useTranslations('characterHeader');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="character-context border-white/10 bg-slate-950/95 text-white backdrop-blur-xl sm:max-w-md"
        style={{ '--character-color': accentColor } as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle>Personalizar Personagem</DialogTitle>
          <DialogDescription className="sr-only">{t('customizeDescription')}</DialogDescription>
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
                const isSelected = color.value === accentColor || (!color.value && !accentColor);

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
  );
}
