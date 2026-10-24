import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import { useSession } from './useSession';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);

function setCookie(cookie: string) {
  document.cookie = cookie;
}

describe('useSession', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.cookie = 'sb-ref-auth-token=; max-age=0';
  });

  it('sem cookie sb- não chama a API e responde signed-out', () => {
    const { result } = renderHookWithProviders(() => useSession());

    expect(result.current).toEqual({ user: null, status: 'signed-out' });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('com cookie sb- e 200 responde signed-in com o user', async () => {
    setCookie('sb-ref-auth-token=x');
    api.get.mockResolvedValue({ id: 'u1', email: 'a@b.c' });

    const { result } = renderHookWithProviders(() => useSession());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
    expect(result.current.user).toEqual({ id: 'u1', email: 'a@b.c' });
    expect(api.get).toHaveBeenCalledWith('/api/auth/session');
  });

  it('com cookie sb- e 401 responde signed-out', async () => {
    setCookie('sb-ref-auth-token=expired');
    api.get.mockRejectedValue(new APIError('Unauthorized', 401));

    const { result } = renderHookWithProviders(() => useSession());

    await waitFor(() => expect(result.current).toEqual({ user: null, status: 'signed-out' }));
  });

  it('com a sessão já lida pelo servidor não pede nada', () => {
    setCookie('sb-ref-auth-token=x');

    const { result } = renderHookWithProviders(() => useSession({ id: 'u1' }));

    expect(result.current).toEqual({ user: { id: 'u1' }, status: 'signed-in' });
    expect(api.get).not.toHaveBeenCalled();
  });
});
