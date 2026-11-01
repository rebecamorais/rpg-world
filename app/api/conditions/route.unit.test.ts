import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('GET /api/conditions', () => {
  beforeEach(() => resetApi());

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET(jsonRequest('/api/conditions'), routeContext());

    expect(res.status).toBe(401);
  });

  it('lista as condições no idioma pedido', async () => {
    api.conditionsApi.list.mockReturnValue([{ id: 'prone' }]);

    const res = await GET(jsonRequest('/api/conditions?locale=pt'), routeContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'prone' }]);
    expect(api.conditionsApi.list).toHaveBeenCalledWith('pt');
  });

  it('usa en sem locale', async () => {
    api.conditionsApi.list.mockReturnValue([]);

    await GET(jsonRequest('/api/conditions'), routeContext());

    expect(api.conditionsApi.list).toHaveBeenCalledWith('en');
  });
});
