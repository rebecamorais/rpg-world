import { ReactElement, ReactNode } from 'react';

import { vi } from 'vitest';

import { CharacterContextProvider } from '@frontend/context/CharacterContext';
import { useDraft } from '@frontend/hooks/useDraft';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { renderWithProviders } from './render';

/**
 * Renders a sheet component with a real draft of `character`, as CharacterProvider would but
 * without fetching. `draft()` returns the character as edited so far.
 */
export function renderWithCharacter(ui: ReactElement, character: DnD5eCharacter) {
  const save = vi.fn(async () => {});
  const latest: { draft: DnD5eCharacter | null; isDirty: boolean } = {
    draft: character,
    isDirty: false,
  };

  function Harness({ children }: { children: ReactNode }) {
    const { draft, isDirty, update } = useDraft(character);
    latest.draft = draft;
    latest.isDirty = isDirty;
    return (
      <CharacterContextProvider
        state={{ character: draft, isDirty }}
        actions={{ update, save }}
        meta={{ id: character.id, isLoading: false, isSaving: false, error: null }}
      >
        {children}
      </CharacterContextProvider>
    );
  }

  const result = renderWithProviders(<Harness>{ui}</Harness>);
  return {
    ...result,
    save,
    draft: () => latest.draft!,
    isDirty: () => latest.isDirty,
  };
}
