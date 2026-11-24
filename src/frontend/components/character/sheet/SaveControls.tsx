'use client';

import {
  type CSSProperties,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import {
  useCharacterActions,
  useCharacterMeta,
  useCharacterState,
} from '@frontend/context/CharacterContext';
import { useHasFieldErrors } from '@frontend/context/FieldValidityContext';
import { useOnline } from '@frontend/hooks/useOnline';
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
  /** The save was refused because the sheet changed elsewhere: the bar offers Reload instead. */
  conflict?: boolean;
  onReload?: () => void;
  /** Names the buttons when they save more than one draft ("Save all"). */
  saveLabel?: string;
}

/**
 * Where the sheet stacks its fixed save bars. The character's draft is kept across tabs, so the
 * sheet shows its bar on every tab, unless the tab claims it: the Status tab (its header has the
 * save button) and the Lore tab (one bar saves the lore and the sheet together).
 */
interface SaveBarSlot {
  /** The column's element, set by its ref once it mounts. */
  setElement: (element: HTMLElement | null) => void;
  getElement: () => HTMLElement | null;
  subscribe: (listener: () => void) => () => void;
  /** Called by SaveCharacterButton while mounted; returns the cleanup. */
  claimCharacterBar: () => () => void;
}

/**
 * The context value never changes. The slot's ref fires as the sheet hydrates, while the tab below
 * may still be a streamed Suspense boundary waiting to be revealed. A new context value then would
 * make React drop that boundary's server HTML and render it again in the browser, and for a moment
 * the page had the tab twice (the e2e saw two "AC" fields). The element goes through a store instead.
 */
function createSaveBarSlot(onClaimsChange: (change: number) => void): SaveBarSlot {
  let element: HTMLElement | null = null;
  const listeners = new Set<() => void>();
  return {
    setElement: (next) => {
      if (next === element) return;
      element = next;
      listeners.forEach((listener) => listener());
    },
    getElement: () => element,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    claimCharacterBar: () => {
      onClaimsChange(1);
      return () => onClaimsChange(-1);
    },
  };
}

const noElement = () => null;
const noSubscription = () => () => {};

/** The column's element; null on the server, while hydrating and outside a sheet. */
function useSlotElement(slot: SaveBarSlot | null): HTMLElement | null {
  return useSyncExternalStore(
    slot?.subscribe ?? noSubscription,
    slot?.getElement ?? noElement,
    noElement,
  );
}

/**
 * Where the fixed save bars sit: above the sheet's tab bar while it's there (below md), across
 * the same span with a 1rem gutter. Between sm and md that span starts right of the side menu
 * (`--sidebar-offset`, as SheetTabBar), or a long label would push the bar under the menu.
 * From md the tab bar is gone and the bar keeps to the bottom right corner.
 */
const SAVE_BAR_POSITION =
  'fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 sm:left-[calc(var(--sidebar-offset)+1rem)] md:right-6 md:bottom-4 md:left-auto';

const SaveBarSlotContext = createContext<SaveBarSlot | null>(null);

/**
 * How much of the bottom of the window the save bars cover, on `<html>` as `--save-bar-space`
 * while there is a bar: the footer keeps that much room under its last line (FooterContent) and
 * the toasts open above it (AppToasterClient), so neither ends up under Discard and Save.
 */
const SAVE_BAR_SPACE = '--save-bar-space';

function useReserveSaveBarSpace(slot: HTMLElement | null) {
  useEffect(() => {
    if (!slot) return;
    const root = document.documentElement;
    const measure = () => {
      if (slot.childElementCount === 0) {
        root.style.removeProperty(SAVE_BAR_SPACE);
        return;
      }
      const space = Math.max(0, window.innerHeight - slot.getBoundingClientRect().top);
      root.style.setProperty(SAVE_BAR_SPACE, `${Math.ceil(space)}px`);
    };
    measure();
    // Bars come and go, a bar's text wraps, and a resize moves the slot (above the tab bar on phones)
    const bars = new MutationObserver(measure);
    bars.observe(slot, { childList: true });
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    size?.observe(slot);
    window.addEventListener('resize', measure);
    return () => {
      bars.disconnect();
      size?.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty(SAVE_BAR_SPACE);
    };
  }, [slot]);
}

/**
 * Frame for the sheet's save bars. Renders the character's bar on tabs that don't claim it.
 * The column of bars goes after `children`, outside the sheet's `isolate` wrapper: inside it, the
 * bars' `z-40` only counted within the sheet, and the footer (later in the page) was painted over
 * Discard and Save. `className` and `style` carry the character's colors to the bars.
 */
export function SaveBarSlotProvider({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [claims, setClaims] = useState(0);
  const [slot] = useState(() => createSaveBarSlot((change) => setClaims((n) => n + change)));
  const attachSlot = useCallback((element: HTMLElement | null) => slot.setElement(element), [slot]);
  useReserveSaveBarSpace(useSlotElement(slot));

  return (
    <SaveBarSlotContext.Provider value={slot}>
      {children}
      {claims === 0 && <CharacterSaveBar />}
      <div
        ref={attachSlot}
        data-save-bar-slot
        className={cn(
          SAVE_BAR_POSITION,
          'pointer-events-none flex flex-col items-stretch gap-2 [&>*]:pointer-events-auto',
          className,
        )}
        style={style}
      />
    </SaveBarSlotContext.Provider>
  );
}

/** The sheet's column of fixed bottom bars, or null outside a sheet. */
export function useSaveBarSlot(): HTMLElement | null {
  return useSlotElement(useContext(SaveBarSlotContext));
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
  conflict,
  onReload,
  saveLabel,
}: SaveControlsProps) {
  const t = useTranslations('common');

  return (
    <>
      {/* `contents`: the save state goes first in the page's actions, so whatever comes before the
          button there (the sheet's gear) stays right next to it */}
      <div className="contents">
        {/* Always rendered, so screen readers hear the change; on phones only visually hidden
            (not `hidden`), so it's still announced there */}
        <span
          role="status"
          title={isDirty ? t('saveShortcut') : undefined}
          className="text-warning-flare sr-only order-first mr-1 items-center gap-1.5 text-sm sm:not-sr-only sm:flex"
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
          // After a conflict the bar's Reload comes first: saving again would be refused again
          disabled={!isDirty || hasErrors || conflict}
          loading={isSaving}
          // No text-label: buttons keep the case of their text
          className="h-8 px-4"
        >
          {isSaving ? t('saving') : (saveLabel ?? t('saveChanges'))}
        </Button>
      </div>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
        onDiscard={onDiscard}
        hasErrors={hasErrors}
        label={label}
        conflict={conflict}
        onReload={onReload}
        saveLabel={saveLabel}
      />
    </>
  );
}

/**
 * The bar fixed at the bottom while there are edits, with Discard and Save (the page header
 * scrolls away). Ctrl/Cmd+S saves. Offline it says nothing will be saved (Save then fails at
 * once, keeping the edits); after a conflict, Save gives way to Reload.
 */
function SaveBar({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  hasErrors = false,
  label,
  conflict = false,
  onReload,
  saveLabel,
}: SaveControlsProps) {
  const t = useTranslations('common');
  const slot = useSaveBarSlot();
  const online = useOnline();
  const canSave = isDirty && !isSaving && !hasErrors && !conflict;
  useSaveShortcut(canSave ? onSave : null);
  const confirm = useConfirm();

  if (!isDirty || typeof document === 'undefined') return null;

  const discard = async () => {
    const ok = await confirm({
      title: t('discardConfirmTitle'),
      description: t('discardConfirm'),
      confirmLabel: t('discard'),
      destructive: true,
    });
    if (ok) onDiscard();
  };

  return createPortal(
    <div
      className={cn(
        'border-border bg-popover/95 flex items-center justify-between gap-4 rounded-xl border p-3 shadow-2xl backdrop-blur-md sm:pl-4',
        // Outside a sheet (no slot), the bar places itself
        !slot && SAVE_BAR_POSITION,
      )}
    >
      {conflict ? (
        <span role="alert" className="text-danger-flare flex items-center gap-1.5 text-sm">
          <span className="bg-danger h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          {t('changedElsewhere')}
        </span>
      ) : hasErrors ? (
        <span role="alert" className="text-danger-flare flex items-center gap-1.5 text-sm">
          <span className="bg-danger h-2 w-2 rounded-full" aria-hidden="true" />
          {t('fixFieldsToSave')}
        </span>
      ) : !online ? (
        <span className="text-warning-flare flex items-center gap-1.5 text-sm">
          <span className="bg-warning h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          {t('offlineDraft')}
        </span>
      ) : (
        <span className="text-warning-flare flex items-center gap-1.5 text-sm">
          <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
          {label ?? t('unsavedChanges')}
        </span>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={discard} disabled={isSaving}>
          {t('discard')}
        </Button>
        {conflict && onReload ? (
          <Button variant="character" size="sm" onClick={onReload}>
            {t('reload')}
          </Button>
        ) : (
          <Button
            variant="character"
            size="sm"
            onClick={onSave}
            loading={isSaving}
            disabled={hasErrors}
          >
            {saveLabel ?? t('save')}
          </Button>
        )}
      </div>
    </div>,
    slot ?? document.body,
  );
}

/** The character draft's state and actions, for its save controls. Null on a read-only sheet. */
export function useCharacterSave() {
  const { isDirty } = useCharacterState();
  const { id, isSaving, conflict } = useCharacterMeta();
  const { save, discard, reload } = useCharacterActions();
  const hasErrors = useHasFieldErrors();
  const { readOnly } = useSheetSource(id);

  if (readOnly) return null;
  return {
    isDirty,
    isSaving,
    onSave: save,
    onDiscard: discard,
    hasErrors,
    conflict,
    onReload: reload,
  };
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

/** Tells the sheet this tab shows the character's save controls itself. */
export function useClaimCharacterBar() {
  const claimCharacterBar = useContext(SaveBarSlotContext)?.claimCharacterBar;
  useEffect(() => claimCharacterBar?.(), [claimCharacterBar]);
}

/** Save controls of the Status tab, wired to the character draft. None on a read-only sheet. */
export function SaveCharacterButton() {
  const save = useCharacterSave();
  useClaimCharacterBar();

  if (!save) return null;
  return <SaveControls {...save} />;
}
