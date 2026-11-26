import { NextRequest } from 'next/server';

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
    expect(api.authApi.signInWithPassword).toHaveBeenCalledWith(
      'hero@example.com',
      'secret',
      undefined,
    );
  });

  it('passa o IP de quem pede, para o limite por IP', async () => {
    api.authApi.signInWithPassword.mockResolvedValue({ success: true });

    const res = await POST(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'hero@example.com', password: 'secret' }),
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
      }),
      routeContext(),
    );

    expect(res.status).toBe(200);
    expect(api.authApi.signInWithPassword).toHaveBeenCalledWith(
      'hero@example.com',
      'secret',
      '203.0.113.7',
    );
  });

  it('muitas tentativas: 429 com o código neutro e os minutos de espera', async () => {
    api.authApi.signInWithPassword.mockRejectedValue(
      new AppError('auth_error_signin_too_many_attempts', 'rate_limited', {
        retryAfterMinutes: 15,
      }),
    );

    const res = await POST(
      jsonRequest('/api/auth/login', 'POST', { email: 'hero@example.com', password: 'wrong' }),
      routeContext(),
    );

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: 'auth_error_signin_too_many_attempts',
      retryAfterMinutes: 15,
    });
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
