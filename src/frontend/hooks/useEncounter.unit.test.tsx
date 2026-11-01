import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useEncounter } from './useEncounter';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), patch: vi.fn() },
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
});
