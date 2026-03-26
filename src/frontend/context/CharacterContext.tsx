'use client';

import { ReactNode, createContext, useContext } from 'react';

import { useParams } from 'next/navigation';

import type { UseMutateFunction } from '@tanstack/react-query';

import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterEditor } from '@frontend/hooks/useCharacterEditor';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

type CharacterContextType = ReturnType<typeof useCharacterEditor> & {
  isSaving: boolean;
  deleteCharacter: UseMutateFunction<void, Error, DnD5eCharacter, unknown>;
  updateCharacter: UseMutateFunction<void, Error, DnD5eCharacter, unknown>;
  isLoading: boolean;
  queryError: Error | null;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = params?.id as string;

  const {
    character: fetchedCharacter,
    isLoading,
    error: queryError,
    deleteCharacter,
    updateCharacter,
    isSaving,
  } = useCharacter(id);

  const editor = useCharacterEditor({ fetchedCharacter, queryError });

  return (
    <CharacterContext.Provider
      value={{
        ...editor,
        isSaving,
        deleteCharacter,
        updateCharacter,
        isLoading,
        queryError,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacterContext() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
}
