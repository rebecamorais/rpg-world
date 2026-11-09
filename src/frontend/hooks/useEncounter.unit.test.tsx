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
});
