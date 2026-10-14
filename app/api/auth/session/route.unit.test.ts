import { SESSION_USER, api, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('GET /api/auth/session', () => {
  beforeEach(() => resetApi());

  it('devolve o usuário da sessão', async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(SESSION_USER);
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toBeNull();
  });

  it('responde 500 sem detalhes quando a leitura da sessão falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.getSessionUser.mockRejectedValue(new Error('auth service down'));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toBeNull();
  });
});
