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

import type { CharacterKind, CharacterSummary } from '@shared/types/character';

interface DeleteCharacterDialogProps {
  character: CharacterSummary | null;
  /** An NPC is called an NPC: "Delete character?" on an enemy sheet reads like a mistake. */
  kind?: CharacterKind;
  confirmName: string;
  onConfirmNameChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  /** Where the focus goes once the dialog closes; the card that opened it may be gone. */
  onCloseAutoFocus?: (event: Event) => void;
}

export function DeleteCharacterDialog({
  character,
  kind = 'pc',
  confirmName,
  onConfirmNameChange,
  onConfirm,
  onCancel,
  isPending,
  onCloseAutoFocus,
}: DeleteCharacterDialogProps) {
  const tCharacters = useTranslations('characters');
  const tEnemies = useTranslations('enemies');
  const tCommon = useTranslations('common');
  // The texts that name what is deleted; the field and the buttons are the same for both
  const tKind = kind === 'npc' ? tEnemies : tCharacters;
  // trim: a name pasted with a trailing space would keep the button off with no clue why
  const canDelete = !!character && confirmName.trim() === character.name.trim();

  return (
    // Not while the delete is on its way: closing then would leave the outcome (the card gone, the
    // focus to move) to land after the dialog, on whatever card opens it next
    <Dialog open={!!character} onOpenChange={(open) => !open && !isPending && onCancel()}>
      <DialogContent className="border-danger-muted" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{tKind('deleteDialogTitle')}</DialogTitle>
          {/* wrap-anywhere: a name with no spaces breaks inside the dialog, not past its edge */}
          <DialogDescription className="wrap-anywhere">
            {tKind('deleteDialogDescription', { name: character?.name || '' })}
          </DialogDescription>
        </DialogHeader>
        {/* Outside the description: a <p> can't hold this block */}
        <p className="border-warning-muted bg-warning-surface text-warning-flare rounded-md border p-3 text-sm wrap-anywhere">
          {/* t.rich builds React elements, so the name is always text, never HTML */}
          {tKind.rich('deleteConfirmInstruction', {
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
            aria-label={tCharacters('deleteConfirmPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            value={confirmName}
            onChange={(e) => onConfirmNameChange(e.target.value)}
            placeholder={tCharacters('deleteConfirmPlaceholder')}
            className="bg-muted"
          />
        </form>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
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
