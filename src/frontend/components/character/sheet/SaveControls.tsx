'use client';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { Button } from '@frontend/components/ui/button';
import {
  useCharacterActions,
  useCharacterMeta,
  useCharacterState,
} from '@frontend/context/CharacterContext';
import { useHasFieldErrors } from '@frontend/context/FieldValidityContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { useSaveShortcut } from '@frontend/hooks/useUnsavedChanges';

interface SaveControlsProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** A field holds an invalid value: saving waits until it's fixed. */
  hasErrors?: boolean;
}

/**
 * Save controls of a sheet tab:
 * - in the page header, the save state ("Unsaved changes") and the save button;
 * - while there are edits, a bar fixed at the bottom with Discard and Save (the header scrolls away);
 * - Ctrl/Cmd+S saves.
 * With an invalid field, saving is held and the bar says why.
 */
export function SaveControls({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  hasErrors = false,
}: SaveControlsProps) {
  const t = useTranslations('common');
  const canSave = isDirty && !isSaving && !hasErrors;
  useSaveShortcut(canSave ? onSave : null);

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
          disabled={!isDirty || hasErrors}
          loading={isSaving}
          className="text-label h-8 px-4"
        >
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      {isDirty &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="border-border bg-popover/95 fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-4 rounded-xl border p-3 shadow-2xl backdrop-blur-md sm:right-6 sm:left-auto sm:pl-4">
            {hasErrors ? (
              <span role="alert" className="text-label text-danger-flare flex items-center gap-1.5">
                <span className="bg-danger h-2 w-2 rounded-full" aria-hidden="true" />
                {t('fixFieldsToSave')}
              </span>
            ) : (
              <span className="text-label text-warning-flare flex items-center gap-1.5">
                <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
                {t('unsavedChanges')}
              </span>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={discard} disabled={isSaving}>
                {t('discard')}
              </Button>
              <Button
                variant="character"
                size="sm"
                onClick={onSave}
                loading={isSaving}
                disabled={hasErrors}
              >
                {t('save')}
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Save controls of the Status tab, wired to the character draft. None on a read-only sheet. */
export function SaveCharacterButton() {
  const { isDirty } = useCharacterState();
  const { id, isSaving } = useCharacterMeta();
  const { save, discard } = useCharacterActions();
  const hasErrors = useHasFieldErrors();
  const { readOnly } = useSheetSource(id);

  if (readOnly) return null;

  return (
    <SaveControls
      isDirty={isDirty}
      isSaving={isSaving}
      onSave={save}
      onDiscard={discard}
      hasErrors={hasErrors}
    />
  );
}
