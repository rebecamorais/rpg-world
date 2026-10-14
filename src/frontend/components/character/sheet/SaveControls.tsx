'use client';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { Button } from '@frontend/components/ui/button';
import {
  useCharacterActions,
  useCharacterMeta,
  useCharacterState,
} from '@frontend/context/CharacterContext';
import { useSaveShortcut } from '@frontend/hooks/useUnsavedChanges';

interface SaveControlsProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Save controls of a sheet tab:
 * - in the page header, the save state ("Unsaved changes") and the save button;
 * - on phones, while there are edits, a bar fixed at the bottom with Discard and Save;
 * - Ctrl/Cmd+S saves.
 */
export function SaveControls({ isDirty, isSaving, onSave, onDiscard }: SaveControlsProps) {
  const t = useTranslations('common');
  useSaveShortcut(isDirty && !isSaving ? onSave : null);

  const discard = () => {
    if (window.confirm(t('discardConfirm'))) onDiscard();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Always rendered, so screen readers hear the change */}
        <span
          role="status"
          title={isDirty ? t('saveShortcut') : undefined}
          className="text-label text-warning-flare hidden items-center gap-1.5 sm:flex"
        >
          {isDirty && (
            <>
              <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
              {t('unsavedChanges')}
            </>
          )}
        </span>
        <Button
          variant="character"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          loading={isSaving}
          className="text-label h-8 px-4"
        >
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      {isDirty &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="border-border bg-popover/95 fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-md sm:hidden">
            <span className="text-label text-warning-flare flex items-center gap-1.5">
              <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
              {t('unsavedChanges')}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={discard} disabled={isSaving}>
                {t('discard')}
              </Button>
              <Button variant="character" size="sm" onClick={onSave} loading={isSaving}>
                {t('save')}
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Save controls of the Status tab, wired to the character draft. */
export function SaveCharacterButton() {
  const { isDirty } = useCharacterState();
  const { isSaving } = useCharacterMeta();
  const { save, discard } = useCharacterActions();

  return <SaveControls isDirty={isDirty} isSaving={isSaving} onSave={save} onDiscard={discard} />;
}
