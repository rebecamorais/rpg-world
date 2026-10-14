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
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

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

interface CharacterCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterCustomizationDialog({
  open,
  onOpenChange,
}: CharacterCustomizationDialogProps) {
  const t = useTranslations('characterHeader');
  const { id, avatarUrl, accentColor } = useLoadedCharacter();
  const { update } = useCharacterActions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="character-context bg-background/95 backdrop-blur-xl sm:max-w-md"
        style={characterTheme(accentColor).style}
      >
        <DialogHeader>
          <DialogTitle>{t('customizeTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('customizeDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Label className="text-sm font-medium">{t('avatarLabel')}</Label>
            <ImageUpload
              currentUrl={avatarUrl}
              target="character"
              targetId={id}
              onUploadSuccess={(url: string) => update({ avatarUrl: url })}
              size="lg"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">{t('accentColorLabel')}</Label>
            <div className="grid grid-cols-5 gap-3">
              {PREDEFINED_COLORS.map((color) => {
                const isSelected = color.value === accentColor || (!color.value && !accentColor);

                return (
                  <button
                    key={color.name}
                    onClick={() => {
                      update({ accentColor: color.value });
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
                        <div className="bg-foreground h-1.5 w-1.5 rounded-full shadow-sm" />
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
