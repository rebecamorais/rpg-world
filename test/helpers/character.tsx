import { ReactElement, ReactNode } from 'react';

import { vi } from 'vitest';

import { CharacterContextProvider } from '@frontend/context/CharacterContext';
import { FileUploaderProvider } from '@frontend/context/FileUploaderContext';
import { type DraftPatch, resolvePatch, useDraft } from '@frontend/hooks/useDraft';
import { characterChanges } from '@frontend/lib/character-changes';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { renderWithProviders } from './render';

/**
 * Renders a sheet component with a real draft of `character`, as CharacterProvider would but
 * without fetching. `draft()` returns the character as edited so far; `sentNow(i)` is what the
 * i-th `saveNow` call (the last by default) would send to the server, as CharacterProvider does.
 */
export function renderWithCharacter(ui: ReactElement, character: DnD5eCharacter) {
  const save = vi.fn(async () => {});
  const saveNow = vi.fn(async (_patch: DraftPatch<DnD5eCharacter>) => {});
  const sentNow = (index = -1) =>
    characterChanges(character, resolvePatch(saveNow.mock.calls.at(index)![0], character));
  const latest: { draft: DnD5eCharacter | null; isDirty: boolean } = {
    draft: character,
    isDirty: false,
  };

  function Harness({ children }: { children: ReactNode }) {
    const { draft, isDirty, update, discard } = useDraft(character);
    latest.draft = draft;
    latest.isDirty = isDirty;
    return (
      <CharacterContextProvider
        state={{ character: draft, isDirty }}
        actions={{ update, save, saveNow, discard }}
        meta={{ id: character.id, isLoading: false, isSaving: false, error: null }}
      >
        {children}
      </CharacterContextProvider>
    );
  }

  const result = renderWithProviders(
    <FileUploaderProvider>
      <Harness>{ui}</Harness>
    </FileUploaderProvider>,
  );
  return {
    ...result,
    save,
    saveNow,
    sentNow,
    draft: () => latest.draft!,
    isDirty: () => latest.isDirty,
  };
}
