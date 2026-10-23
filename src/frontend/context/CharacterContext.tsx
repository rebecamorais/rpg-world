'use client';

import { type ReactNode, createContext, useCallback, useContext, useMemo } from 'react';

import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { FieldValidityProvider } from '@frontend/context/FieldValidityContext';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { type DraftPatch, useDraft } from '@frontend/hooks/useDraft';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

/*
 * The character sheet's state, split in three so a component re-renders only for what it reads:
 * - state: the draft being edited (changes on every keystroke);
 * - actions: stable functions to change and save it (never change, safe in memo deps);
 * - meta: loading, saving and error flags.
 * Lore and spells are not here: each tab loads its own (see LoreTab, SpellsTab).
 */

export interface CharacterState {
  character: DnD5eCharacter | null;
  /** Edits not saved yet. */
  isDirty: boolean;
}

export interface CharacterActions {
  /** Changes the draft: `update({ ac: 15 })` or a patch from `lib/character-sheet-updates`. */
  update: (patch: DraftPatch<DnD5eCharacter>) => void;
  save: () => Promise<void>;
  /** Drops the unsaved edits. */
  discard: () => void;
}

export interface CharacterMeta {
  id: string;
  isLoading: boolean;
  isSaving: boolean;
  /** Translated load error, if any. */
  error: string | null;
}

const StateContext = createContext<CharacterState | null>(null);
const ActionsContext = createContext<CharacterActions | null>(null);
const MetaContext = createContext<CharacterMeta | null>(null);

/** Provides already-built values. The app uses CharacterProvider; tests can use this directly. */
export function CharacterContextProvider({
  state,
  actions,
  meta,
  children,
}: {
  state: CharacterState;
  actions: CharacterActions;
  meta: CharacterMeta;
  children: ReactNode;
}) {
  return (
    <MetaContext.Provider value={meta}>
      <ActionsContext.Provider value={actions}>
        <StateContext.Provider value={state}>
          {/* The sheet's number fields report here; saving waits while one is invalid */}
          <FieldValidityProvider>{children}</FieldValidityProvider>
        </StateContext.Provider>
      </ActionsContext.Provider>
    </MetaContext.Provider>
  );
}

/**
 * Loads the character of the current route and keeps the sheet's draft. `initialCharacter` is
 * the one the server already loaded, so the sheet opens without fetching it again.
 */
export function CharacterProvider({
  initialCharacter,
  children,
}: {
  initialCharacter?: DnD5eCharacter;
  children: ReactNode;
}) {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations('characters');
  const { getErrorMessage } = useErrorMessage();

  const {
    character: fetched,
    isLoading,
    error,
    updateCharacter,
    isSaving,
  } = useCharacter(id, { initial: initialCharacter });
  const { draft, isDirty, update, commit, discard } = useDraft(fetched);

  const save = useCallback(async () => {
    try {
      await commit(updateCharacter);
      toast.success(t('saveSuccess'));
    } catch {
      // useCharacter already shows the error
    }
  }, [commit, updateCharacter, t]);

  const state = useMemo(() => ({ character: draft, isDirty }), [draft, isDirty]);
  const actions = useMemo(() => ({ update, save, discard }), [update, save, discard]);
  const meta = useMemo(
    () => ({ id, isLoading, isSaving, error: error ? getErrorMessage(error) : null }),
    [id, isLoading, isSaving, error, getErrorMessage],
  );

  return (
    <CharacterContextProvider state={state} actions={actions} meta={meta}>
      {children}
    </CharacterContextProvider>
  );
}

function useRequired<T>(context: React.Context<T | null>): T {
  const value = useContext(context);
  if (!value) throw new Error('Character hooks must be used within a CharacterProvider');
  return value;
}

export const useCharacterState = () => useRequired(StateContext);
export const useCharacterActions = () => useRequired(ActionsContext);
export const useCharacterMeta = () => useRequired(MetaContext);

/** The loaded character. Only for components rendered after the layout's loading guard. */
export function useLoadedCharacter(): DnD5eCharacter {
  const { character } = useCharacterState();
  if (!character) throw new Error('The character has not loaded yet');
  return character;
}
