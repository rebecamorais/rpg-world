import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { PARTIES_POLL_MS, useParties } from './useParties';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('useParties', () => {
  // The phone menu (in the header) renders the sidebar outside the dashboard's UserProvider
  it('funciona fora do UserProvider', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      asGm: [],
      asPlayer: [],
      invites: [],
      requests: [],
    });

    const { result } = renderHookWithProviders(() => useParties());

    await waitFor(() => expect(result.current.parties).toBeDefined());
  });

  it('responder a um convite age na linha da própria pessoa', async () => {
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    const { result } = renderHookWithProviders(() => useParties());

    result.current.respond({ partyId: 'p1', userId: 'u1', accept: true });

    await waitFor(() =>
      expect(rpgWorldApi.patch).toHaveBeenCalledWith('/api/parties/p1/members/u1'),
    );
  });

  // d-fase2-tempo-real#3: an invite reaches someone not in the party: no channel tells them
  it('a lista de mesas pergunta de novo a cada minuto, para um convite novo aparecer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.mocked(rpgWorldApi.get).mockReset().mockResolvedValue({
        asGm: [],
        asPlayer: [],
        invites: [],
        requests: [],
      });
      const { result } = renderHookWithProviders(() => useParties({ poll: true }));
      await waitFor(() => expect(result.current.parties).toBeDefined());
      expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);

      await act(() => vi.advanceTimersByTimeAsync(PARTIES_POLL_MS));

      expect(rpgWorldApi.get).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fora da lista (o menu em toda tela) não pergunta sozinho', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.mocked(rpgWorldApi.get).mockReset().mockResolvedValue({
        asGm: [],
        asPlayer: [],
        invites: [],
        requests: [],
      });
      const { result } = renderHookWithProviders(() => useParties());
      await waitFor(() => expect(result.current.parties).toBeDefined());

      await act(() => vi.advanceTimersByTimeAsync(PARTIES_POLL_MS * 2));

      expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
