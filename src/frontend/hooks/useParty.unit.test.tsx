import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useParty } from './useParty';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('useParty', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  // Nothing pushes a request to become GM, so a party without one is polled
  it.each([
    [false, 2],
    [true, 1],
  ])('com hasGm=%s a mesa é buscada %i vez(es) depois de 20 segundos', async (hasGm, calls) => {
    vi.mocked(rpgWorldApi.get).mockClear();
    vi.mocked(rpgWorldApi.get).mockResolvedValue({ id: 'p1', hasGm });
    const { result } = renderHookWithProviders(() => useParty('p1'));
    await waitFor(() => expect(result.current.party).toBeDefined());

    await vi.advanceTimersByTimeAsync(20_000);

    expect(rpgWorldApi.get).toHaveBeenCalledTimes(calls);
  });
});
