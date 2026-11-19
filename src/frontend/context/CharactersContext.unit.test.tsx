import { act } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { CharacterSummary } from '@shared/types/character';

import { CharactersProvider, neighborOf, useCharactersContext } from './CharactersContext';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', () => ({ rpgWorldApi: { delete: vi.fn() } }));
vi.mock('@frontend/hooks/useCharacters', () => ({
  useCharacters: () => ({ characters: [joan], isLoading: false, error: null }),
}));
const demo = vi.hoisted(() => ({ isDemo: false, refuseWrite: vi.fn() }));
vi.mock('@frontend/demo/DemoContext', () => ({ useDemo: () => demo }));

const joan = { id: 'joan', name: 'Joan' } as CharacterSummary;
const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('neighborOf', () => {
  it('o seguinte, ou o anterior no fim da lista', () => {
    expect(neighborOf(list, 'a')).toBe('b');
    expect(neighborOf(list, 'b')).toBe('c');
    expect(neighborOf(list, 'c')).toBe('b');
  });

  it('nenhum quando era o único, ou quando não está na lista', () => {
    expect(neighborOf([{ id: 'a' }], 'a')).toBeNull();
    expect(neighborOf(list, 'x')).toBeNull();
  });
});

describe('CharactersProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    demo.isDemo = false;
  });

  const renderContext = () =>
    renderHookWithProviders(() => useCharactersContext(), {
      wrapper: ({ children }) => <CharactersProvider kind="npc">{children}</CharactersProvider>,
    });

  it('exclusão que falha avisa no toast e não deixa rejeição solta', async () => {
    vi.mocked(rpgWorldApi.delete).mockRejectedValueOnce(new Error('boom'));
    const { result } = renderContext();

    act(() => result.current.setCharacterToDelete(joan));
    await act(() => expect(result.current.handleDelete()).resolves.toBeUndefined());

    expect(toast.error).toHaveBeenCalled();
    // The dialog stays open, to try again or cancel
    expect(result.current.characterToDelete).toBe(joan);
  });

  it('na demo, Excluir abre o convite na hora, sem o pedido de digitar o nome', () => {
    demo.isDemo = true;
    const { result } = renderContext();

    act(() => result.current.setCharacterToDelete(joan));

    expect(demo.refuseWrite).toHaveBeenCalledTimes(1);
    expect(result.current.characterToDelete).toBeNull();
  });
});
