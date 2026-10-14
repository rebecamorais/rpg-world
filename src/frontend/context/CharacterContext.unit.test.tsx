import { act, renderHook, waitFor } from '@testing-library/react';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { setAttribute } from '@frontend/lib/character-sheet-updates';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import {
  CharacterProvider,
  useCharacterActions,
  useCharacterMeta,
  useCharacterState,
} from './CharacterContext';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'char-1' }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', () => ({
  rpgWorldApi: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);

const character = {
  ...createDnD5eCharacter('user-1', 'Thor'),
  id: 'char-1',
  accentColor: '#ff0000',
} as DnD5eCharacter;

function renderContext() {
  return renderHookWithProviders(
    () => ({
      state: useCharacterState(),
      actions: useCharacterActions(),
      meta: useCharacterMeta(),
    }),
    { wrapper: CharacterProvider },
  );
}

async function renderLoaded() {
  const rendered = renderContext();
  await waitFor(() => expect(rendered.result.current.state.character).not.toBeNull());
  return rendered;
}

describe('CharacterContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A tiny server: GET returns whatever the last PUT saved
    let stored = character;
    api.get.mockImplementation(async () => stored);
    api.put.mockImplementation(async (_url, body) => {
      stored = (body as { updates: DnD5eCharacter }).updates;
      return { id: 'char-1' };
    });
  });

  it('carrega só o personagem da rota (lore e magias ficam nas próprias abas)', async () => {
    const { result } = await renderLoaded();

    expect(result.current.state.character?.name).toBe('Thor');
    expect(result.current.meta).toMatchObject({ id: 'char-1', isLoading: false, error: null });
    expect(api.get.mock.calls.map(([url]) => url)).toEqual(['/api/characters/char-1']);
  });

  it('edita o rascunho e marca alterações não salvas', async () => {
    const { result } = await renderLoaded();

    act(() => {
      result.current.actions.update({ name: 'Thor Odinson' });
      result.current.actions.update(setAttribute('STR', 18));
    });

    expect(result.current.state.character).toMatchObject({
      name: 'Thor Odinson',
      attributes: { STR: 18 },
    });
    expect(result.current.state.isDirty).toBe(true);
  });

  it('as ações não mudam de identidade enquanto o rascunho muda', async () => {
    const { result } = await renderLoaded();
    const before = result.current.actions;

    act(() => result.current.actions.update({ ac: 18 }));

    expect(result.current.actions).toBe(before);
  });

  it('salva o rascunho, avisa o usuário e limpa as alterações', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.actions.update({ name: 'Thor Odinson' }));

    await act(() => result.current.actions.save());

    expect(api.put).toHaveBeenCalledWith('/api/characters/char-1', {
      updates: expect.objectContaining({ name: 'Thor Odinson' }),
    });
    expect(toast.success).toHaveBeenCalledWith(messages.characters.saveSuccess);
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.state.character?.name).toBe('Thor Odinson');
  });

  it('quando salvar falha, mostra o erro traduzido e mantém as alterações', async () => {
    api.put.mockRejectedValue(new Error('character_error_forbidden'));
    const { result } = await renderLoaded();
    act(() => result.current.actions.update({ name: 'Unsaved' }));

    await act(() => result.current.actions.save());

    expect(toast.error).toHaveBeenCalledWith(messages.common.errors.character_error_forbidden);
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.state.isDirty).toBe(true);
  });

  it('traduz o erro de carregamento', async () => {
    api.get.mockRejectedValue(new Error('character_error_not_found'));
    const { result } = renderContext();

    await waitFor(() =>
      expect(result.current.meta.error).toBe(messages.common.errors.character_error_not_found),
    );
    expect(result.current.state.character).toBeNull();
  });

  it('exige o CharacterProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useCharacterState())).toThrow(
      'Character hooks must be used within a CharacterProvider',
    );
  });
});
