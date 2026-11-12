'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

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
import { cn } from '@frontend/lib/utils';

interface SaveControlsProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** A field holds an invalid value: saving waits until it's fixed. */
  hasErrors?: boolean;
  /** What the fixed bar says is unsaved, when the sheet can show more than one bar. */
  label?: string;
}

/**
 * Where the sheet stacks its fixed save bars. A tab can have two drafts at once (the
 * character's, kept across tabs, and the lore's): their bars sit one above the other.
 * The page header's save button tells the sheet it's there, so the sheet doesn't add a
 * second one for the character.
 */
interface SaveBarSlot {
  element: HTMLElement | null;
  /** Called by SaveCharacterButton while mounted; returns the cleanup. */
  claimCharacterBar: () => () => void;
}

const SaveBarSlotContext = createContext<SaveBarSlot | null>(null);

/** Frame for the sheet's save bars. Renders the character's bar on tabs without a save button. */
export function SaveBarSlotProvider({ children }: { children: ReactNode }) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [claims, setClaims] = useState(0);
  const [slot] = useState<Omit<SaveBarSlot, 'element'>>(() => ({
    claimCharacterBar: () => {
      setClaims((n) => n + 1);
      return () => setClaims((n) => n - 1);
    },
  }));

  return (
    <SaveBarSlotContext.Provider value={{ element, ...slot }}>
      {children}
      {claims === 0 && <CharacterSaveBar />}
      <div
        ref={setElement}
        className="pointer-events-none fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-stretch gap-2 sm:right-6 sm:left-auto md:bottom-4 [&>*]:pointer-events-auto"
      />
    </SaveBarSlotContext.Provider>
  );
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
  label,
}: SaveControlsProps) {
  const t = useTranslations('common');

  return (
    <>
      {/* `contents`: the save state goes first in the page's actions, so whatever comes before the
          button there (the sheet's gear) stays right next to it */}
      <div className="contents">
        {/* Always rendered, so screen readers hear the change */}
        <span
          role="status"
          title={isDirty ? t('saveShortcut') : undefined}
          className="text-label text-warning-flare order-first mr-1 hidden items-center gap-1.5 sm:flex"
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

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        onDiscard={onDiscard}
        hasErrors={hasErrors}
        label={label}
      />
    </>
  );
}

/**
 * The bar fixed at the bottom while there are edits, with Discard and Save (the page header
 * scrolls away). Ctrl/Cmd+S saves.
 */
function SaveBar({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  hasErrors = false,
  label,
}: SaveControlsProps) {
  const t = useTranslations('common');
  const slot = useContext(SaveBarSlotContext)?.element;
  const canSave = isDirty && !isSaving && !hasErrors;
  useSaveShortcut(canSave ? onSave : null);

  if (!isDirty || typeof document === 'undefined') return null;

  const discard = () => {
    if (window.confirm(t('discardConfirm'))) onDiscard();
  };

  return createPortal(
    <div
      className={cn(
        'border-border bg-popover/95 flex items-center justify-between gap-4 rounded-xl border p-3 shadow-2xl backdrop-blur-md sm:pl-4',
        // Outside a sheet (no slot), the bar places itself
        !slot &&
          'fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 sm:right-6 sm:left-auto md:bottom-4',
      )}
    >
      {hasErrors ? (
        <span role="alert" className="text-label text-danger-flare flex items-center gap-1.5">
          <span className="bg-danger h-2 w-2 rounded-full" aria-hidden="true" />
          {t('fixFieldsToSave')}
        </span>
      ) : (
        <span className="text-label text-warning-flare flex items-center gap-1.5">
          <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
          {label ?? t('unsavedChanges')}
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
    slot ?? document.body,
  );
}

/** The character draft's state and actions, for its save controls. Null on a read-only sheet. */
function useCharacterSave() {
  const { isDirty } = useCharacterState();
  const { id, isSaving } = useCharacterMeta();
  const { save, discard } = useCharacterActions();
  const hasErrors = useHasFieldErrors();
  const { readOnly } = useSheetSource(id);

  if (readOnly) return null;
  return { isDirty, isSaving, onSave: save, onDiscard: discard, hasErrors };
}

/**
 * The character's bar on tabs whose header has no save button (Spells, Inventory, Lore):
 * the character draft survives switching tabs, so its edits stay visible and savable.
 */
function CharacterSaveBar() {
  const t = useTranslations('common');
  const save = useCharacterSave();
  if (!save) return null;
  return <SaveBar {...save} label={t('unsavedSheet')} />;
}

/** Save controls of the Status tab, wired to the character draft. None on a read-only sheet. */
export function SaveCharacterButton() {
  const save = useCharacterSave();
  const claimCharacterBar = useContext(SaveBarSlotContext)?.claimCharacterBar;
  useEffect(() => claimCharacterBar?.(), [claimCharacterBar]);

  if (!save) return null;
  return <SaveControls {...save} />;
}
