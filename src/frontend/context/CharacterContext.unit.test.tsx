import { act, renderHook, waitFor } from '@testing-library/react';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { CharacterProvider, useCharacterContext } from './CharacterContext';

let pathname = '/system/DnD_5e/character/char-1';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'char-1' }),
  usePathname: () => pathname,
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
const lore = { backstory: 'Son of Odin' };
const spells = [{ id: 'fireball', name: 'Fireball', level: 3, school: 'evocation' }];

function respond(url: string) {
  if (url === '/api/characters/char-1') return Promise.resolve(character);
  if (url === '/api/characters/char-1/lore') return Promise.resolve(lore);
  if (url.startsWith('/api/characters/char-1/spells')) return Promise.resolve(spells);
  return Promise.reject(new Error(`unexpected GET ${url}`));
}

function renderContext() {
  return renderHookWithProviders(() => useCharacterContext(), { wrapper: CharacterProvider });
}

function requestedUrls() {
  return api.get.mock.calls.map(([url]) => url);
}

describe('CharacterContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = '/system/DnD_5e/character/char-1';
    api.get.mockImplementation(respond as typeof api.get);
    api.put.mockResolvedValue({ id: 'char-1' });
    api.post.mockResolvedValue({ success: true });
  });

  it('carrega o personagem da rota', async () => {
    const { result } = renderContext();

    await waitFor(() => expect(result.current.character?.name).toBe('Thor'));
    expect(result.current.isLoading).toBe(false);
  });

  it('não busca lore nem magias fora das abas que as usam', async () => {
    const { result } = renderContext();

    await waitFor(() => expect(result.current.character).not.toBeNull());
    expect(requestedUrls()).toEqual(['/api/characters/char-1']);
  });

  it('na aba de lore, busca a lore e junta ao personagem', async () => {
    pathname = '/system/DnD_5e/character/char-1/lore';
    const { result } = renderContext();

    await waitFor(() => expect(result.current.character?.backstory).toBe('Son of Odin'));
    expect(result.current.character?.name).toBe('Thor');
  });

  it('busca as magias quando a gaveta de magias abre', async () => {
    const { result } = renderContext();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    act(() => result.current.setIsSpellsOpen(true));

    await waitFor(() => expect(result.current.spellsKnown).toEqual(['fireball']));
    expect(requestedUrls()).toContain('/api/characters/char-1/spells?locale=en');
  });

  it('salva o personagem, avisa o usuário e chama onSuccess', async () => {
    const onSuccess = vi.fn();
    const { result } = renderContext();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    await act(() => result.current.updateCharacter(result.current.character!, { onSuccess }));

    expect(api.put).toHaveBeenCalledWith('/api/characters/char-1', {
      updates: expect.objectContaining({ name: 'Thor' }),
    });
    expect(toast.success).toHaveBeenCalledWith(messages.characters.saveSuccess);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('mostra o erro traduzido e não chama onSuccess quando salvar falha', async () => {
    api.put.mockRejectedValue(new Error('character_error_forbidden'));
    const onSuccess = vi.fn();
    const { result } = renderContext();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    await act(() => result.current.updateCharacter(result.current.character!, { onSuccess }));

    expect(toast.error).toHaveBeenCalledWith(messages.common.errors.character_error_forbidden);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('prepara magias pelo endpoint do personagem', async () => {
    const { result } = renderContext();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    await act(() => result.current.handleTogglePrepared('fireball', true));

    expect(api.post).toHaveBeenCalledWith('/api/characters/char-1/spells', {
      id: 'fireball',
      action: 'prepare',
    });
  });

  it('exige o CharacterProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useCharacterContext())).toThrow(
      'useCharacterContext must be used within a CharacterProvider',
    );
  });
});
