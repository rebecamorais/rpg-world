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
      <DialogContent className="border-danger-muted">
        <DialogHeader>
          <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
          <DialogDescription className="space-y-4">
            <span className="block">
              {t('deleteDialogDescription', { name: character?.name || '' })}
            </span>
            <div className="border-warning-muted bg-warning-surface text-warning-flare rounded-md border p-3 text-sm">
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
            className="bg-muted"
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={confirmName !== character?.name}
            loading={isPending}
          >
            {tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
