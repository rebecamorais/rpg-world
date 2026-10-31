import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useParties } from './useParties';

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
});
