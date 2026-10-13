import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, ApiClient } from './apiClient';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ApiClient', () => {
  const client = new ApiClient('https://api.test');

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('faz GET no caminho prefixado pela base e devolve o JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    await expect(client.get('/characters')).resolves.toEqual({ id: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/characters');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it.each(['post', 'put', 'patch'] as const)('serializa o body em JSON no %s', async (method) => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client[method]('/x', { name: 'Hero' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe(method.toUpperCase());
    expect(init.body).toBe('{"name":"Hero"}');
  });

  it('mantém headers extras sem perder o Content-Type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await client.get('/x', { headers: { 'X-Trace': 'abc' } });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'X-Trace': 'abc',
    });
  });

  it('devolve objeto vazio em 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(client.delete('/characters/1')).resolves.toEqual({});
  });

  it('lança APIError com o código do campo error, o status e o corpo', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'character_error_not_found' }, 404));

    const error = (await client.get('/characters/1').catch((e) => e)) as APIError;

    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('character_error_not_found');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ error: 'character_error_not_found' });
  });

  it('usa o campo message quando não há error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'rate limited' }, 429));

    await expect(client.get('/x')).rejects.toMatchObject({ message: 'rate limited', status: 429 });
  });

  it('usa uma mensagem genérica quando o corpo do erro não é JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(client.get('/x')).rejects.toMatchObject({
      message: 'An error occurred',
      status: 502,
      data: {},
    });
  });
});
