'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Input } from '@frontend/components/ui/input';

import type { CharacterSummary } from '@shared/types/character';

interface DeleteCharacterDialogProps {
  character: CharacterSummary | null;
  confirmName: string;
  onConfirmNameChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function DeleteCharacterDialog({
  character,
  confirmName,
  onConfirmNameChange,
  onConfirm,
  onCancel,
  isPending,
}: DeleteCharacterDialogProps) {
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  return (
    <Dialog open={!!character} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="character-context border-red-500/20 bg-slate-950/95 text-white backdrop-blur-xl"
        style={{ '--character-color': 'var(--red)' } as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
          <DialogDescription className="space-y-4">
            <span className="block">
              {t('deleteDialogDescription', { name: character?.name || '' })}
            </span>
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              <p
                dangerouslySetInnerHTML={{
                  __html: t.markup('deleteConfirmInstruction', {
                    name: character?.name || '',
                    bold: (chunks: React.ReactNode) => `<strong>${chunks}</strong>`,
                  }),
                }}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={confirmName}
            onChange={(e) => onConfirmNameChange(e.target.value)}
            placeholder={t('deleteConfirmPlaceholder')}
            className="bg-muted focus-visible:ring-primary/30"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
          <Button
            destroy
            onClick={onConfirm}
            disabled={confirmName !== character?.name || isPending}
          >
            {isPending ? tCommon('loading') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
