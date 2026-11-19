'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useDemo } from '@frontend/demo/DemoContext';
import { isDemoReadOnly } from '@frontend/demo/transport';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { charactersQueryKey } from '@frontend/lib/query-keys';

import type { CharacterKind, CharacterSummary } from '@shared/types/character';

interface CharactersContextType {
  kind: CharacterKind;
  characters: CharacterSummary[];
  isLoading: boolean;
  error: Error | null;

  // Deletion logic
  characterToDelete: CharacterSummary | null;
  setCharacterToDelete: (character: CharacterSummary | null) => void;
  confirmName: string;
  setConfirmName: (name: string) => void;
  handleDelete: () => Promise<void>;
  isDeleting: boolean;
  /**
   * Once, after a delete: the card to focus instead of the one that is gone (`next` null when the
   * list is now empty). Null when the dialog closed without deleting.
   */
  takeFocusAfterDelete: () => { next: string | null } | null;
}

/** The character after the deleted one, or the one before it at the end of the list. */
export function neighborOf(list: { id: string }[], id: string): string | null {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  return list[index + 1]?.id ?? list[index - 1]?.id ?? null;
}

const CharactersContext = createContext<CharactersContextType | null>(null);

export function CharactersProvider({
  children,
  kind = 'pc',
}: {
  children: ReactNode;
  kind?: CharacterKind;
}) {
  const { characters, isLoading, error } = useCharacters(kind);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterSummary | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const queryClient = useQueryClient();
  const t = useTranslations('characters');
  const tEnemies = useTranslations('enemies');
  const { getErrorMessage } = useErrorMessage();
  // Set on a delete, read once by the dialog as it closes
  const focusAfterDelete = useRef<{ next: string | null } | null>(null);
  // The id whose dialog is open: a delete that lands after its dialog closed leaves no focus behind
  const openId = useRef<string | null>(null);
  const { isDemo, refuseWrite } = useDemo();
  const selectToDelete = useCallback(
    (character: CharacterSummary | null) => {
      // The demo refuses at once, before asking to type the name of what it would never delete
      if (character && isDemo) return refuseWrite();
      openId.current = character?.id ?? null;
      setCharacterToDelete(character);
    },
    [isDemo, refuseWrite],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await rpgWorldApi.delete(`/api/characters/${id}`);
    },
    onSuccess: (_, id) => {
      if (openId.current === id) focusAfterDelete.current = { next: neighborOf(characters, id) };
      // Off the list now, not after the refetch: the dialog hands the focus to the next card as
      // it closes, and the deleted one must already be gone by then
      queryClient.setQueryData<CharacterSummary[]>(charactersQueryKey(kind), (list) =>
        list?.filter((character) => character.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(kind === 'npc' ? tEnemies('deleteSuccess') : t('deleteSuccess'));
      selectToDelete(null);
      setConfirmName('');
    },
    onError: (err: Error) => {
      if (!isDemoReadOnly(err)) toast.error(getErrorMessage(err));
    },
  });

  const handleDelete = useCallback(async () => {
    if (!characterToDelete) return;
    try {
      await deleteMutation.mutateAsync(characterToDelete.id);
    } catch {
      // onError already said why; the dialog stays open to try again or cancel
    }
  }, [characterToDelete, deleteMutation]);

  const takeFocusAfterDelete = useCallback(() => {
    const target = focusAfterDelete.current;
    focusAfterDelete.current = null;
    return target;
  }, []);

  const value = useMemo(
    () => ({
      kind,
      characters,
      isLoading,
      error: error as Error | null,
      characterToDelete,
      setCharacterToDelete: selectToDelete,
      confirmName,
      setConfirmName,
      handleDelete,
      isDeleting: deleteMutation.isPending,
      takeFocusAfterDelete,
    }),
    [
      kind,
      characters,
      isLoading,
      error,
      characterToDelete,
      selectToDelete,
      confirmName,
      deleteMutation.isPending,
      handleDelete,
      takeFocusAfterDelete,
    ],
  );

  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>;
}

/**
 * Hook to access the characters context.
 * Useful for components within the dashboard list view.
 */
export function useCharactersContext() {
  const context = useContext(CharactersContext);
  if (!context) {
    throw new Error('useCharactersContext must be used within a CharactersProvider');
  }
  return context;
}
