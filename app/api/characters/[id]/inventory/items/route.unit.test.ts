import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const CONTAINER = '0b8f6a52-3c1d-4e7a-8d2b-5a9c7e1f4b30';
const REF = 'dnd5e:srd-5.2:item:rope';
const url = `/api/characters/${ID}/inventory/items`;
const body = { ref: REF, containerId: CONTAINER, quantity: 2 };

describe('/api/characters/[id]/inventory/items', () => {
  beforeEach(() => resetApi());

  it('POST adiciona o item em nome do usuário da sessão e devolve a entrada', async () => {
    const entry = { id: 'i1', containerId: CONTAINER, ref: REF, quantity: 2, item: null };
    api.charactersApi.addItem.mockResolvedValue(entry);

    const res = await POST(jsonRequest(`${url}?locale=pt`, 'POST', body), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(entry);
    expect(api.charactersApi.addItem).toHaveBeenCalledWith(ID, SESSION_USER.id, body, 'pt');
  });

  it.each([
    ['quantidade 0', { ...body, quantity: 0 }],
    ['quantidade acima de 9999', { ...body, quantity: 10_000 }],
    ['quantidade fracionada', { ...body, quantity: 1.5 }],
    ['ref que não é de item', { ...body, ref: 'dnd5e:srd-5.1:spell:fireball' }],
    ['lugar que não é uuid', { ...body, containerId: 'bag' }],
    ['sem ref', { containerId: CONTAINER, quantity: 1 }],
  ])('POST responde 400 com %s', async (_name, invalid) => {
    const res = await POST(jsonRequest(url, 'POST', invalid), routeContext({ id: ID }));
    expect(res.status).toBe(400);
    expect(api.charactersApi.addItem).not.toHaveBeenCalled();
  });
});
