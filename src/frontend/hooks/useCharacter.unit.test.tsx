import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import { useCharacter } from './useCharacter';

vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), put: vi.fn() } }));

const api = vi.mocked(rpgWorldApi);
const ARANI = { id: 'c1', name: 'Arani' } as DnD5eCharacter;

describe('useCharacter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa a personagem que veio do servidor, sem buscá-la de novo', () => {
    const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: ARANI }));

    expect(result.current.character).toEqual(ARANI);
    expect(result.current.isLoading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('busca a personagem quando o servidor não a entregou', async () => {
    api.get.mockResolvedValue(ARANI);

    const { result } = renderHookWithProviders(() => useCharacter('c1'));

    await waitFor(() => expect(result.current.character).toEqual(ARANI));
    expect(api.get).toHaveBeenCalledWith('/api/characters/c1');
  });

  it('com fetch: false só lê o que outro carregou, sem buscar', () => {
    const { result } = renderHookWithProviders(() => useCharacter('c1', { fetch: false }));

    expect(result.current.character).toBeUndefined();
    expect(api.get).not.toHaveBeenCalled();
  });
});
