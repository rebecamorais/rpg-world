'use client';

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
          <DialogDescription>
            {t('deleteDialogDescription', { name: character?.name || '' })}
          </DialogDescription>
        </DialogHeader>
        {/* Outside the description: a <p> can't hold this block */}
        <p className="border-warning-muted bg-warning-surface text-warning-flare rounded-md border p-3 text-sm">
          {/* t.rich builds React elements, so the name is always text, never HTML */}
          {t.rich('deleteConfirmInstruction', {
            name: character?.name || '',
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <div className="py-2">
          <Input
            aria-label={t('deleteConfirmPlaceholder')}
            autoComplete="off"
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
