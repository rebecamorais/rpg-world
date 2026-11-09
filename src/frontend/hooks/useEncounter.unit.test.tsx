import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useEncounter } from './useEncounter';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), patch: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

describe('useEncounter', () => {
  // The API answers 204 without a combat, and the client turns 204 into {}
  it('sem combate (204) o encounter é null', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({});

    const { result } = renderHookWithProviders(() => useEncounter('party-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.encounter).toBeNull();
  });

  it('com combate devolve a visão', async () => {
    const view = { role: 'player', round: 1, turns: [] };
    vi.mocked(rpgWorldApi.get).mockResolvedValue(view);

    const { result } = renderHookWithProviders(() => useEncounter('party-1'));

    await waitFor(() => expect(result.current.encounter).toEqual(view));
  });

  // "Sort by initiative" right after typing the last one: the sort must see the new value
  it('mudar a iniciativa aparece na hora, antes de o servidor responder', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [{ participantId: 'a', initiative: null, hp: { current: 5, max: 7, temp: 0 } }],
    });
    vi.mocked(rpgWorldApi.patch).mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());

    result.current.updateParticipant.mutate({ participantId: 'a', initiative: 15 });

    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({ rows: [{ initiative: 15 }] }),
    );
  });

  it('destino, testes e revelação aparecem na hora', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [
        {
          participantId: 'a',
          fate: 'dead',
          deathSaves: null,
          deathRevealed: true,
          hp: { current: 0, max: 7, temp: 0 },
        },
      ],
    });
    vi.mocked(rpgWorldApi.patch).mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());

    result.current.updateParticipant.mutate({ participantId: 'a', fate: 'death_saves' });
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [
          { fate: 'death_saves', deathRevealed: false, deathSaves: { successes: 0, failures: 0 } },
        ],
      }),
    );

    result.current.updateParticipant.mutate({
      participantId: 'a',
      deathSaves: { successes: 1, failures: 2 },
    });
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [{ fate: 'death_saves', deathSaves: { successes: 1, failures: 2 } }],
      }),
    );

    result.current.updateParticipant.mutate({ participantId: 'a', fate: 'dead' });
    result.current.updateParticipant.mutate({ participantId: 'a', deathRevealed: true });
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [{ fate: 'dead', deathSaves: null, deathRevealed: true }],
      }),
    );

    result.current.updateParticipant.mutate({ participantId: 'a', fate: null });
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [{ fate: null, deathSaves: null, deathRevealed: false }],
      }),
    );
  });

  it('setConditions manda a lista inteira e já a mostra na linha e na vez', async () => {
    const conditions = [{ key: 'dnd5e:srd-5.2:condition:prone', level: null }];
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [{ participantId: 'a', conditions: [] }],
    });
    vi.mocked(rpgWorldApi.put).mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());

    result.current.setConditions.mutate({ participantId: 'a', conditions });

    await waitFor(() =>
      expect(rpgWorldApi.put).toHaveBeenCalledWith(
        '/api/parties/party-1/encounter/participants/a/conditions',
        { conditions },
      ),
    );
    await waitFor(() => expect(result.current.encounter).toMatchObject({ rows: [{ conditions }] }));
  });

  it('a iniciativa do jogador aparece na hora na visão do jogador', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'player',
      round: 0,
      hiddenTurn: false,
      turns: [
        { participantId: 'a', isMine: true, initiative: null },
        { participantId: 'b', isMine: false, initiative: null },
      ],
    });
    vi.mocked(rpgWorldApi.put).mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());

    result.current.setMyInitiative.mutate({ participantId: 'a', initiative: 17 });

    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        turns: [{ initiative: 17 }, { initiative: null }],
      }),
    );
    expect(rpgWorldApi.put).toHaveBeenCalledWith(
      '/api/parties/party-1/encounter/participants/a/initiative',
      { initiative: 17 },
    );
  });

  it('previousTurn chama a rota de voltar turno', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({});
    vi.mocked(rpgWorldApi.post).mockResolvedValue(undefined);
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));

    result.current.previousTurn.mutate();

    await waitFor(() =>
      expect(rpgWorldApi.post).toHaveBeenCalledWith('/api/parties/party-1/encounter/turn/previous'),
    );
  });

  // Two initiatives typed in a row: when the first save answers, refetching would read the
  // database before the second is saved and undo it on screen, and "Sort" would see the old value
  it('com outra mudança ainda a caminho, não busca de novo (só quando a última termina)', async () => {
    const row = (participantId: string, initiative: number | null) => ({
      participantId,
      initiative,
      hp: { current: 5, max: 7, temp: 0 },
    });
    vi.mocked(rpgWorldApi.get).mockReset();
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [row('a', null), row('b', null)],
    });
    let answerFirst!: () => void;
    let answerSecond!: () => void;
    vi.mocked(rpgWorldApi.patch)
      .mockReturnValueOnce(new Promise<void>((resolve) => (answerFirst = resolve)))
      .mockReturnValueOnce(new Promise<void>((resolve) => (answerSecond = resolve)));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());
    expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);

    result.current.updateParticipant.mutate({ participantId: 'a', initiative: 15 });
    result.current.updateParticipant.mutate({ participantId: 'b', initiative: 10 });
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [{ initiative: 15 }, { initiative: 10 }],
      }),
    );

    // The database has the first one only
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [row('a', 15), row('b', null)],
    });
    answerFirst();
    await waitFor(() => expect(result.current.updateParticipant.isPending).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);
    expect(result.current.encounter).toMatchObject({
      rows: [{ initiative: 15 }, { initiative: 10 }],
    });

    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      role: 'gm',
      round: 0,
      rows: [row('a', 15), row('b', 10)],
    });
    answerSecond();
    await waitFor(() => expect(rpgWorldApi.get).toHaveBeenCalledTimes(2));
  });

  // The previous change's refetch can still be on its way when the next one finishes: it read the
  // database before that one, so the next one must fetch again rather than wait for it
  it('uma mudança que termina durante a busca da anterior busca de novo', async () => {
    const row = (participantId: string) => ({
      participantId,
      initiative: null,
      hp: { current: 5, max: 7, temp: 0 },
    });
    const view = { role: 'gm', round: 0, rows: [row('a'), row('b')] };
    vi.mocked(rpgWorldApi.get).mockReset();
    vi.mocked(rpgWorldApi.get).mockResolvedValueOnce(view);
    vi.mocked(rpgWorldApi.patch).mockResolvedValueOnce(undefined);
    vi.mocked(rpgWorldApi.put).mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHookWithProviders(() => useEncounter('party-1'));
    await waitFor(() => expect(result.current.encounter).not.toBeNull());

    // The first change's refetch never answers
    vi.mocked(rpgWorldApi.get).mockReturnValueOnce(new Promise(() => {}));
    result.current.updateParticipant.mutate({ participantId: 'a', initiative: 15 });
    await waitFor(() => expect(rpgWorldApi.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.updateParticipant.isPending).toBe(false));

    let answerOrder!: () => void;
    vi.mocked(rpgWorldApi.put).mockReset();
    vi.mocked(rpgWorldApi.put).mockReturnValueOnce(
      new Promise<void>((resolve) => (answerOrder = resolve)),
    );
    vi.mocked(rpgWorldApi.get).mockResolvedValue(view);
    result.current.setOrder.mutate(['b', 'a']);
    // Shown at once, like the other changes
    await waitFor(() =>
      expect(result.current.encounter).toMatchObject({
        rows: [{ participantId: 'b' }, { participantId: 'a' }],
      }),
    );
    answerOrder();

    await waitFor(() => expect(rpgWorldApi.get).toHaveBeenCalledTimes(3));
  });
});
