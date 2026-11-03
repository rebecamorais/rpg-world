import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('GET /api/items', () => {
  beforeEach(() => resetApi());

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET(jsonRequest('/api/items'), routeContext());

    expect(res.status).toBe(401);
  });

  it('lista os itens no idioma pedido', async () => {
    api.itemsApi.list.mockReturnValue([{ id: 'rope-hempen' }]);

    const res = await GET(jsonRequest('/api/items?locale=pt'), routeContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'rope-hempen' }]);
    expect(api.itemsApi.list).toHaveBeenCalledWith('pt');
  });

  it('usa en sem locale', async () => {
    api.itemsApi.list.mockReturnValue([]);

    await GET(jsonRequest('/api/items'), routeContext());

    expect(api.itemsApi.list).toHaveBeenCalledWith('en');
  });

  it('responde 400 com locale inválido', async () => {
    const res = await GET(jsonRequest(`/api/items?locale=${'x'.repeat(101)}`), routeContext());

    expect(res.status).toBe(400);
  });
});
