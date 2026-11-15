import { act, waitFor } from '@testing-library/react';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import { useCharacter } from './useCharacter';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), put: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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

    it('uma busca no meio de um toque salvando espera o servidor ter o toque', async () => {
      let finish = () => {};
      api.put.mockImplementation(() => new Promise((resolve) => (finish = () => resolve({}))));
      api.get.mockResolvedValue({ ...ARANI, hpCurrent: 7 });
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: ARANI }),
      );

      let saved!: Promise<void>;
      act(() => {
        saved = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        });
      });
      // The Save button or the window coming back to focus asks for the sheet meanwhile
      void queryClient.invalidateQueries({ queryKey: ['character', 'c1'] });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.character?.hpCurrent).toBe(7);

      await act(async () => {
        finish();
        await saved;
      });
      await waitFor(() => expect(api.get).toHaveBeenCalled());
      expect(result.current.character?.hpCurrent).toBe(7);
    });

    it('se falhar, rejeita e volta o campo ao valor do servidor, sem esperar a rede; a fila segue', async () => {
      api.put.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: { ...ARANI, hpCurrent: 33 } }),
      );

      await act(async () => {
        await expect(
          result.current.saveQuietly({
            character: { ...ARANI, hpCurrent: 23 },
            changes: { hpCurrent: 23 },
          }),
        ).rejects.toThrow('offline');
      });
      // Back without a refetch: offline, a refetch would wait and leave the 23 on screen
      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({ hpCurrent: 33 });
      await waitFor(() => expect(result.current.character?.hpCurrent).toBe(33));
      expect(api.get).not.toHaveBeenCalled();

      await act(() =>
        result.current.saveQuietly({ character: { ...ARANI, ac: 15 }, changes: { ac: 15 } }),
      );
      expect(api.put).toHaveBeenLastCalledWith(
        '/api/characters/c1',
        { updates: { ac: 15 } },
        { keepalive: true },
      );
    });

    it('sem conexão, diz que nada foi salvo e "Tentar de novo" manda o mesmo valor', async () => {
      api.put.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({});
      const { result } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: { ...ARANI, hpCurrent: 33 } }),
      );

      await act(async () => {
        await result.current
          .saveQuietly({ character: { ...ARANI, hpCurrent: 23 }, changes: { hpCurrent: 23 } })
          .catch(() => {});
      });

      expect(toast.error).toHaveBeenCalledWith(
        messages.common.errors.common_error_network,
        expect.objectContaining({ action: expect.objectContaining({ label: 'Try again' }) }),
      );
      const { action } = vi.mocked(toast.error).mock.calls[0][1] as unknown as {
        action: { onClick: () => void };
      };
      await act(async () => action.onClick());

      await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2));
      expect(api.put).toHaveBeenLastCalledWith(
        '/api/characters/c1',
        { updates: { hpCurrent: 23 } },
        { keepalive: true },
      );
      expect(result.current.character?.hpCurrent).toBe(23);
    });

    it('duas falhas no mesmo toast: "Tentar de novo" manda as duas', async () => {
      api.put
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({});
      const { result } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: { ...ARANI, hpCurrent: 33, ac: 12 } }),
      );

      await act(async () => {
        await result.current
          .saveQuietly({
            character: { ...ARANI, hpCurrent: 23, ac: 12 },
            changes: { hpCurrent: 23 },
          })
          .catch(() => {});
      });
      await act(async () => {
        await result.current
          .saveQuietly({ character: { ...ARANI, hpCurrent: 33, ac: 15 }, changes: { ac: 15 } })
          .catch(() => {});
      });

      // The second toast replaced the first (same id): its action carries both
      const { action } = vi.mocked(toast.error).mock.calls[1][1] as unknown as {
        action: { onClick: () => void };
      };
      await act(async () => action.onClick());

      await waitFor(() => expect(api.put).toHaveBeenCalledTimes(3));
      expect(api.put).toHaveBeenLastCalledWith(
        '/api/characters/c1',
        { updates: { hpCurrent: 23, ac: 15 } },
        { keepalive: true },
      );
    });

    it('se o primeiro toque falha e o seguinte na mesma chave dá certo, fica o seguinte', async () => {
      let failFirst = (_error: Error) => {};
      api.put
        .mockImplementationOnce(() => new Promise((_resolve, reject) => (failFirst = reject)))
        .mockResolvedValueOnce({});
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: { ...ARANI, hpCurrent: 33 } }),
      );

      let first!: Promise<void>;
      let second!: Promise<void>;
      act(() => {
        first = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 23 },
          changes: { hpCurrent: 23 },
        });
        second = result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 20 },
          changes: { hpCurrent: 20 },
        });
      });
      await act(async () => {
        failFirst(new Error('offline'));
        await first.catch(() => {});
        await second;
      });

      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({ hpCurrent: 20 });
    });

    it('a falha só desfaz o que ela levava, não os toques já salvos', async () => {
      api.put.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('offline'));
      const { result } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: { ...ARANI, hpCurrent: 33, ac: 12 } }),
      );

      await act(() =>
        result.current.saveQuietly({
          character: { ...ARANI, hpCurrent: 30, ac: 12 },
          changes: { hpCurrent: 30 },
        }),
      );
      await act(async () => {
        await result.current
          .saveQuietly({ character: { ...ARANI, hpCurrent: 30, ac: 15 }, changes: { ac: 15 } })
          .catch(() => {});
      });

      await waitFor(() =>
        expect(result.current.character).toMatchObject({ hpCurrent: 30, ac: 12 }),
      );
    });
  });

  describe('revisão (conflito com outro aparelho)', () => {
    const SAVED = { ...ARANI, revision: 4 } as DnD5eCharacter;

    it('Salvar manda a revisão que a ficha tinha e guarda a nova', async () => {
      api.put.mockResolvedValue({ revision: 5 });
      api.get.mockImplementation(() => new Promise(() => {}));
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: SAVED }),
      );

      await act(() =>
        result.current.updateCharacter({ character: { ...SAVED, ac: 15 }, changes: { ac: 15 } }),
      );

      expect(api.put).toHaveBeenCalledWith('/api/characters/c1', {
        updates: { ac: 15 },
        revision: 4,
      });
      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({ ac: 15, revision: 5 });
    });

    it('um toque salvo não mexe na revisão, e o Salvar seguinte não conflita com ele', async () => {
      // The taps of play don't move the revision on the server
      api.put.mockResolvedValueOnce({ revision: 4 }).mockResolvedValueOnce({ revision: 5 });
      const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: SAVED }));

      await act(() =>
        result.current.saveQuietly({
          character: { ...SAVED, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        }),
      );
      await act(() =>
        result.current.updateCharacter({ character: { ...SAVED, ac: 15 }, changes: { ac: 15 } }),
      );

      expect(api.put).toHaveBeenLastCalledWith('/api/characters/c1', {
        updates: { ac: 15 },
        revision: 4,
      });
    });

    it('um toque que termina durante o Salvar não troca a revisão que o Salvar guardou', async () => {
      let finishSave = () => {};
      api.put
        // The Save: answers last
        .mockImplementationOnce(
          () => new Promise((resolve) => (finishSave = () => resolve({ revision: 5 }))),
        )
        // The tap made while the Save is on its way: the server already counts the Save
        .mockResolvedValueOnce({ revision: 5 });
      api.get.mockImplementation(() => new Promise(() => {}));
      const { result, queryClient } = renderHookWithProviders(() =>
        useCharacter('c1', { initial: SAVED }),
      );

      let saved!: Promise<unknown>;
      act(() => {
        saved = result.current.updateCharacter({
          character: { ...SAVED, ac: 15 },
          changes: { ac: 15 },
        });
      });
      await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
      await act(() =>
        result.current.saveQuietly({
          character: { ...SAVED, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        }),
      );
      // The tap answered first and took nothing from it
      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({ revision: 4 });
      await act(async () => {
        finishSave();
        await saved;
      });
      expect(api.put).toHaveBeenNthCalledWith(1, '/api/characters/c1', {
        updates: { ac: 15 },
        revision: 4,
      });
      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({ revision: 5 });

      // A tap built from the render before the Save landed doesn't bring the revision back
      api.put.mockResolvedValueOnce({ revision: 5 });
      await act(() =>
        result.current.saveQuietly({
          character: { ...SAVED, hpCurrent: 6 },
          changes: { hpCurrent: 6 },
        }),
      );
      expect(queryClient.getQueryData(['character', 'c1'])).toMatchObject({
        hpCurrent: 6,
        revision: 5,
      });
    });

    it('se outro aparelho salvou no meio, o toque não esconde isso do Salvar', async () => {
      api.put.mockResolvedValueOnce({ revision: 7 }).mockResolvedValueOnce({ revision: 8 });
      const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: SAVED }));

      await act(() =>
        result.current.saveQuietly({
          character: { ...SAVED, hpCurrent: 7 },
          changes: { hpCurrent: 7 },
        }),
      );
      await act(() =>
        result.current.updateCharacter({ character: { ...SAVED, ac: 15 }, changes: { ac: 15 } }),
      );

      expect(api.put).toHaveBeenLastCalledWith('/api/characters/c1', {
        updates: { ac: 15 },
        revision: 4,
      });
    });

    it('no 409 marca o conflito sem toast; Recarregar busca de novo e limpa', async () => {
      api.put.mockRejectedValue(
        new APIError('An error occurred', 409, { code: 'conflict', revision: 6 }),
      );
      api.get.mockResolvedValue({ ...SAVED, revision: 6, ac: 20 });
      const { result } = renderHookWithProviders(() => useCharacter('c1', { initial: SAVED }));

      await act(async () => {
        await result.current
          .updateCharacter({ character: { ...SAVED, ac: 18 }, changes: { ac: 18 } })
          .catch(() => {});
      });

      expect(result.current.conflict).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();

      let reloaded!: Promise<void>;
      act(() => {
        reloaded = result.current.reload();
      });
      // Until the new copy is in, Save stays held: it would send the old revision again
      expect(result.current.conflict).toBe(true);
      await act(() => reloaded);
      expect(result.current.conflict).toBe(false);
      expect(result.current.character).toMatchObject({ ac: 20, revision: 6 });
    });
  });
});
