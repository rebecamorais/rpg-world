'use client';

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useParams, usePathname } from 'next/navigation';

import { toast } from 'sonner';

import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterEditor } from '@frontend/hooks/useCharacterEditor';
import { useCharacterLore } from '@frontend/hooks/useCharacterLore';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';
import { hexToHsl } from '@frontend/lib/color-utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

type CharacterContextType = ReturnType<typeof useCharacterEditor> & {
  isSaving: boolean;
  deleteCharacter: (character: DnD5eCharacter) => void;
  updateCharacter: (character: DnD5eCharacter, options?: { onSuccess?: () => void }) => void;
  updateLore: (data: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
  queryError: Error | null;
  themeHsl: { h: number; s: number; l: number };

  // Spell management
  characterSpells: CharacterSpell[];
  spellsKnown: string[];
  isSpellsLoading: boolean;
  handleLearnSpell: (id: string) => void;
  handleForgetSpell: (id: string) => void;
  handleTogglePrepared: (id: string, isPrepared: boolean) => void;
  // Death saves management
  handleDeathSavesChange: (successes: number, failures: number) => void;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string;

  // Track if spells drawer is open to trigger loading even on non-spell routes
  // This state is shared with useCharacterEditor
  const [isSpellsOpen, setIsSpellsOpen] = useState(false);

  // Lazy loading triggers
  const isLoreRoute = pathname?.endsWith('/lore');
  const isSpellsRoute = pathname?.endsWith('/spells');

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
  } = useCharacterSpells(id, {
    enabled: !!id && (isSpellsRoute || isSpellsOpen),
  });

  const {
    lore: fetchedLore,
    isLoading: isLoreLoading,
    updateLore,
    isSaving: isLoreSaving,
  } = useCharacterLore(id, {
    enabled: !!id && isLoreRoute,
  });

  // Merge lore into character for the editor
  const mergedCharacter = useMemo(() => {
    if (!fetchedCharacter || !fetchedLore) return fetchedCharacter;
    return { ...fetchedCharacter, ...fetchedLore } as DnD5eCharacter;
  }, [fetchedCharacter, fetchedLore]);

  const editor = useCharacterEditor({
    fetchedCharacter: mergedCharacter,
    queryError: charError as Error | null,
    isSpellsOpen,
    setIsSpellsOpen,
  });

  const handleUpdate = useCallback(
    async (character: DnD5eCharacter, options?: { onSuccess?: () => void }) => {
      try {
        await updateStatus(character);
        toast.success('Alterações salvas com sucesso!');
        options?.onSuccess?.();
      } catch (_e) {
        // Errors are handled inside the hooks via toast
      }
    },
    [updateStatus],
  );

  const themeHsl = useMemo(() => {
    const hex = mergedCharacter?.accentColor || '#663399';
    try {
      return hexToHsl(hex);
    } catch {
      return { h: 270, s: 50, l: 40 };
    }
  }, [mergedCharacter?.accentColor]);

  const spellsKnown = useMemo(() => spells.map((s) => s.id), [spells]);

  const contextValue = useMemo(
    () => ({
      ...editor,
      isSaving: isCharSaving || isLoreSaving,
      deleteCharacter,
      updateCharacter: handleUpdate,
      updateLore: updateLore as (data: Record<string, unknown>) => Promise<void>,
      isLoading:
        isCharLoading || (isLoreRoute && isLoreLoading) || (isSpellsRoute && isSpellsLoading),
      queryError: charError as Error | null,
      themeHsl,

      // Spell management
      characterSpells: spells,
      spellsKnown,
      isSpellsLoading,
      handleLearnSpell: learnSpell,
      handleForgetSpell: forgetSpell,
      handleTogglePrepared: togglePrepared,
      handleDeathSavesChange: editor.handleDeathSavesChange,
    }),
    [
      editor,
      isCharSaving,
      isLoreSaving,
      deleteCharacter,
      handleUpdate,
      updateLore,
      isCharLoading,
      isLoreLoading,
      charError,
      themeHsl,
      spells,
      spellsKnown,
      isSpellsLoading,
      learnSpell,
      forgetSpell,
      togglePrepared,
      isLoreRoute,
      isSpellsRoute,
    ],
  );

  return <CharacterContext.Provider value={contextValue}>{children}</CharacterContext.Provider>;
}

export function useCharacterContext() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
}
