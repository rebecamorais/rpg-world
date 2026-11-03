import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}/inventory`;

describe('/api/characters/[id]/inventory', () => {
  beforeEach(() => resetApi());

  it('GET devolve o inventário no idioma pedido', async () => {
    const inventory = { containers: [], items: [] };
    api.charactersApi.getInventory.mockResolvedValue(inventory);

    const res = await GET(jsonRequest(`${url}?locale=pt`), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(inventory);
    expect(api.charactersApi.getInventory).toHaveBeenCalledWith(ID, SESSION_USER.id, 'pt');
  });

  it('GET usa inglês sem locale', async () => {
    api.charactersApi.getInventory.mockResolvedValue({ containers: [], items: [] });
    await GET(jsonRequest(url), routeContext({ id: ID }));
    expect(api.charactersApi.getInventory).toHaveBeenCalledWith(ID, SESSION_USER.id, 'en');
  });

  it('GET responde 400 com id que não é uuid', async () => {
    const res = await GET(jsonRequest('/api/characters/x/inventory'), routeContext({ id: 'x' }));
    expect(res.status).toBe(400);
    expect(api.charactersApi.getInventory).not.toHaveBeenCalled();
  });

  it('GET responde 401 sem sessão', async () => {
    resetApi(null);
    const res = await GET(jsonRequest(url), routeContext({ id: ID }));
    expect(res.status).toBe(401);
  });
});
