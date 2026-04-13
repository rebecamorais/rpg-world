'use client';

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useCharacters } from '@frontend/hooks/useCharacters';

import type { CharacterSummary } from '@shared/types/character';

interface CharactersContextType {
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
}

const CharactersContext = createContext<CharactersContextType | null>(null);

export function CharactersProvider({ children }: { children: ReactNode }) {
  const { characters, isLoading, error } = useCharacters();
  const [characterToDelete, setCharacterToDelete] = useState<CharacterSummary | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const queryClient = useQueryClient();
  const t = useTranslations('characters');

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await rpgWorldApi.delete(`/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(t('deleteSuccess'));
      setCharacterToDelete(null);
      setConfirmName('');
    },
    onError: (err: Error) => {
      toast.error(err.message || t('deleteError'));
    },
  });

  const handleDelete = useCallback(async () => {
    if (characterToDelete) {
      await deleteMutation.mutateAsync(characterToDelete.id);
    }
  }, [characterToDelete, deleteMutation]);

  const value = useMemo(
    () => ({
      characters,
      isLoading,
      error: error as Error | null,
      characterToDelete,
      setCharacterToDelete,
      confirmName,
      setConfirmName,
      handleDelete,
      isDeleting: deleteMutation.isPending,
    }),
    [
      characters,
      isLoading,
      error,
      characterToDelete,
      confirmName,
      deleteMutation.isPending,
      handleDelete,
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
