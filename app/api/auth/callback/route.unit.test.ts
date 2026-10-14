import { api, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '@backend/contexts/users/domain/UserError';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ORIGIN = 'https://rpg.test';

async function callback(query: string) {
  const res = await GET(new Request(`${ORIGIN}/api/auth/callback?${query}`));
  return { status: res.status, location: res.headers.get('location') };
}

describe('GET /api/auth/callback', () => {
  beforeEach(() => resetApi(null));

  it('troca o código pela sessão e redireciona para o destino pedido', async () => {
    const { status, location } = await callback('code=abc&next=/characters/123');

    expect(status).toBe(307);
    expect(location).toBe(`${ORIGIN}/characters/123`);
    expect(api.authApi.callbackExchange).toHaveBeenCalledWith('abc');
  });

  it('vai para /characters quando não há destino', async () => {
    const { location } = await callback('code=abc');

    expect(location).toBe(`${ORIGIN}/characters`);
  });

  it('ignora destinos fora do site (open redirect)', async () => {
    const { location } = await callback(`code=abc&next=${encodeURIComponent('//evil.com')}`);

    expect(location).toBe(`${ORIGIN}/characters`);
  });

  it('manda o código de erro genérico do provedor, sem repassar a descrição dele', async () => {
    const { location } = await callback('error=access_denied&error_description=User+denied');

    expect(location).toBe(`${ORIGIN}/auth/error?message=auth_error_provider`);
    expect(api.authApi.callbackExchange).not.toHaveBeenCalled();
  });

  it('reconhece link de e-mail expirado vindo do provedor', async () => {
    const { location } = await callback(
      'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
    );

    expect(location).toBe(`${ORIGIN}/auth/error?message=auth_error_link_expired`);
  });

  it('manda para a página de erro quando falta o código', async () => {
    const { location } = await callback('');

    expect(location).toBe(`${ORIGIN}/auth/error?message=no_code_provided`);
  });

  it('repassa o código de erro esperado quando a troca do código falha', async () => {
    api.authApi.callbackExchange.mockRejectedValue(new UserError(UserErrorCodes.AUTH_LINK_EXPIRED));

    const { location } = await callback('code=abc');

    expect(location).toBe(`${ORIGIN}/auth/error?message=auth_error_link_expired`);
  });

  it('não coloca a mensagem de um erro inesperado na URL', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.callbackExchange.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5'));

    const { location } = await callback('code=abc');

    expect(location).toBe(`${ORIGIN}/auth/error?message=common_error_unexpected`);
  });
});
