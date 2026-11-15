import { act, waitFor } from '@testing-library/react';
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

  it('salvar envia só as mudanças, não a personagem inteira', async () => {
    api.put.mockResolvedValue({ id: 'c1' });
    const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: ARANI }));

    await act(() =>
      result.current.updateCharacter({
        character: { ...ARANI, hpCurrent: 7 },
        changes: { hpCurrent: 7 },
      }),
    );

    expect(api.put).toHaveBeenCalledWith('/api/characters/c1', { updates: { hpCurrent: 7 } });
  });

  describe('saveQuietly (o que muda durante o jogo)', () => {
    it('mostra na hora, sem "salvando" nem recarregar depois', async () => {
      let finish = () => {};
      api.put.mockImplementation(() => new Promise((resolve) => (finish = () => resolve({}))));
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: ARANI }),
      );
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

      let saved!: Promise<void>;
      act(() => {
        saved = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        });
      });

      // Still in flight: the sheet already shows it, and nothing says "Saving…"
      await waitFor(() => expect(result.current.character?.hpCurrent).toBe(7));
      expect(result.current.isSaving).toBe(false);
      await act(async () => {
        finish();
        await saved;
      });
      expect(api.put).toHaveBeenCalledWith(
        '/api/characters/c1',
        { updates: { hpCurrent: 7 } },
        { keepalive: true },
      );
      expect(invalidate).not.toHaveBeenCalled();
    });

    it('dois toques seguidos vão ao servidor um depois do outro, na ordem', async () => {
      const sent: unknown[] = [];
      const finishers: (() => void)[] = [];
      api.put.mockImplementation((_path, body) => {
        sent.push(body);
        return new Promise((resolve) => finishers.push(() => resolve({})));
      });
      const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: ARANI }));

      let first!: Promise<void>;
      let second!: Promise<void>;
      act(() => {
        first = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        });
        second = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 6 },
          changes: { hpCurrent: 6 },
        });
      });

      await waitFor(() => expect(sent).toHaveLength(1));
      expect(result.current.character?.hpCurrent).toBe(6);
      await act(async () => {
        finishers[0]();
        await first;
      });
      await waitFor(() => expect(sent).toHaveLength(2));
      expect(sent).toEqual([{ updates: { hpCurrent: 7 } }, { updates: { hpCurrent: 6 } }]);
      await act(async () => {
        finishers[1]();
        await second;
      });
    });

    it('se falhar, rejeita e recarrega a personagem do servidor; a fila segue', async () => {
      api.put.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
      api.get.mockResolvedValue(ARANI);
      const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: ARANI }));

      await act(async () => {
        await expect(
          result.current.saveQuietly({
            character: { ...ARANI, hpCurrent: 7 },
            changes: { hpCurrent: 7 },
          }),
        ).rejects.toThrow('offline');
      });
      await waitFor(() => expect(api.get).toHaveBeenCalled());
      await waitFor(() => expect(result.current.character?.hpCurrent).toBeUndefined());

      await act(() =>
        result.current.saveQuietly({ character: { ...ARANI, ac: 15 }, changes: { ac: 15 } }),
      );
      expect(api.put).toHaveBeenLastCalledWith(
        '/api/characters/c1',
        { updates: { ac: 15 } },
        { keepalive: true },
      );
    });
  });
});
