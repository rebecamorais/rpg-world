'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';

interface CharacterActionBarProps {
  characterName: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export default function CharacterActionBar({
  characterName,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onDelete,
}: CharacterActionBarProps) {
  const tCommon = useTranslations('common');
  const t = useTranslations('characters');

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <Link href="/characters" className="text-muted-foreground hover:text-foreground text-sm">
          {tCommon('back')}
        </Link>
        {hasUnsavedChanges && (
          <span className="rounded bg-amber-500/20 px-2 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
            {tCommon('unsavedChanges')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="bg-primary rounded px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {isSaving ? tCommon('saving') : tCommon('saveChanges')}
        </button>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-sm text-red-600 hover:underline dark:text-red-400"
            >
              {tCommon('delete')}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteDialogDescription', { name: characterName })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {tCommon('cancel')}
                </Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={onDelete}>
                {t('confirmDelete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
