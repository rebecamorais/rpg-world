'use client';

import { ReactNode, createContext, useContext, useMemo } from 'react';

import { useParams } from 'next/navigation';

import { toast } from 'sonner';

import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterEditor } from '@frontend/hooks/useCharacterEditor';
import { useCharacterLore } from '@frontend/hooks/useCharacterLore';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

type CharacterContextType = ReturnType<typeof useCharacterEditor> & {
  isSaving: boolean;
  deleteCharacter: (character: DnD5eCharacter) => void;
  updateCharacter: (character: DnD5eCharacter, options?: { onSuccess?: () => void }) => void;
  updateLore: (data: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
  queryError: Error | null;

  // Spell management
  characterSpells: CharacterSpell[];
  spellsKnown: string[];
  isSpellsLoading: boolean;
  handleLearnSpell: (spellId: string) => void;
  handleForgetSpell: (spellId: string) => void;
  handleTogglePrepared: (spellId: string, isPrepared: boolean) => void;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = params?.id as string;

  const {
    character: fetchedCharacter,
    isLoading: isCharLoading,
    error: charError,
    deleteCharacter,
    updateCharacter: updateStatus,
    isSaving: isCharSaving,
  } = useCharacter(id);

  const {
    spells,
    isLoading: isSpellsLoading,
    learnSpell,
    forgetSpell,
    togglePrepared,
  } = useCharacterSpells(id);

  const {
    lore: fetchedLore,
    isLoading: isLoreLoading,
    updateLore,
    isSaving: isLoreSaving,
  } = useCharacterLore(id);

  // Merge lore into character for the editor
  const mergedCharacter = useMemo(() => {
    if (!fetchedCharacter || !fetchedLore) return fetchedCharacter;
    return { ...fetchedCharacter, ...fetchedLore } as DnD5eCharacter;
  }, [fetchedCharacter, fetchedLore]);

  const editor = useCharacterEditor({
    fetchedCharacter: mergedCharacter,
    queryError: charError as Error | null,
  });

  const handleUpdate = async (character: DnD5eCharacter, options?: { onSuccess?: () => void }) => {
    try {
      await updateStatus(character);
      toast.success('Alterações salvas com sucesso!');
      options?.onSuccess?.();
    } catch (_e) {
      // Errors are handled inside the hooks via toast
    }
  };

  const spellsKnown = useMemo(() => spells.map((s) => s.spellId), [spells]);

  return (
    <CharacterContext.Provider
      value={{
        ...editor,
        isSaving: isCharSaving || isLoreSaving,
        deleteCharacter,
        updateCharacter: handleUpdate,
        updateLore: updateLore as (data: Record<string, unknown>) => Promise<void>,
        isLoading: isCharLoading || isLoreLoading,
        queryError: charError as Error | null,

        // Spell management
        characterSpells: spells,
        spellsKnown,
        isSpellsLoading,
        handleLearnSpell: learnSpell,
        handleForgetSpell: forgetSpell,
        handleTogglePrepared: togglePrepared,
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
