import { api, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('manda para a página de erro quando o provedor devolve erro', async () => {
    const { location } = await callback('error=access_denied&error_description=User+denied');

    expect(location).toBe(`${ORIGIN}/auth/error?message=User%20denied`);
    expect(api.authApi.callbackExchange).not.toHaveBeenCalled();
  });

  it('manda para a página de erro quando falta o código', async () => {
    const { location } = await callback('');

    expect(location).toBe(`${ORIGIN}/auth/error?message=no_code_provided`);
  });

  it('manda para a página de erro quando a troca do código falha', async () => {
    api.authApi.callbackExchange.mockRejectedValue(new Error('link_expired'));

    const { location } = await callback('code=abc');

    expect(location).toBe(`${ORIGIN}/auth/error?message=link_expired`);
  });
});
