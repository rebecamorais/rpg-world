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
  const canDelete = !!character && confirmName === character.name;

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
        {/* A form, so Enter confirms once the name matches */}
        <form
          id="delete-character"
          className="py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canDelete && !isPending) onConfirm();
          }}
        >
          <Input
            aria-label={t('deleteConfirmPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            value={confirmName}
            onChange={(e) => onConfirmNameChange(e.target.value)}
            placeholder={t('deleteConfirmPlaceholder')}
            className="bg-muted"
          />
        </form>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            form="delete-character"
            variant="destructive"
            disabled={!canDelete}
            loading={isPending}
          >
            {tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
