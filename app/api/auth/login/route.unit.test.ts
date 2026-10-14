import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('POST /api/auth/login', () => {
  beforeEach(() => resetApi(null));

  it('autentica com e-mail e senha, sem exigir sessão', async () => {
    api.authApi.signInWithPassword.mockResolvedValue({ success: true });

    const res = await POST(
      jsonRequest('/api/auth/login', 'POST', { email: 'hero@example.com', password: 'secret' }),
      routeContext(),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(api.authApi.signInWithPassword).toHaveBeenCalledWith('hero@example.com', 'secret');
  });

  it('responde 400 com e-mail inválido', async () => {
    const res = await POST(
      jsonRequest('/api/auth/login', 'POST', { email: 'not-an-email', password: 'secret' }),
      routeContext(),
    );

    expect(res.status).toBe(400);
    expect(api.authApi.signInWithPassword).not.toHaveBeenCalled();
  });

  it('repassa o código de credenciais inválidas', async () => {
    api.authApi.signInWithPassword.mockRejectedValue(
      new AppError('auth_error_signin_invalid_credentials'),
    );

    const res = await POST(
      jsonRequest('/api/auth/login', 'POST', { email: 'hero@example.com', password: 'wrong' }),
      routeContext(),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'auth_error_signin_invalid_credentials' });
  });
});
