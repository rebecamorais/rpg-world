import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, PATCH } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const ITEM = '0b8f6a52-3c1d-4e7a-8d2b-5a9c7e1f4b30';
const url = `/api/characters/${ID}/inventory/items/${ITEM}`;
const context = () => routeContext({ id: ID, itemId: ITEM });

describe('/api/characters/[id]/inventory/items/[itemId]', () => {
  beforeEach(() => resetApi());

  it('PATCH grava a quantidade absoluta e responde 204', async () => {
    const res = await PATCH(jsonRequest(url, 'PATCH', { quantity: 7 }), context());

    expect(res.status).toBe(204);
    expect(api.charactersApi.setItemQuantity).toHaveBeenCalledWith(ID, SESSION_USER.id, ITEM, 7);
  });

  it.each([0, 10_000, 2.5, '3'])('PATCH responde 400 com quantidade %s', async (quantity) => {
    const res = await PATCH(jsonRequest(url, 'PATCH', { quantity }), context());
    expect(res.status).toBe(400);
    expect(api.charactersApi.setItemQuantity).not.toHaveBeenCalled();
  });

  it('PATCH responde 400 com itemId que não é uuid', async () => {
    const res = await PATCH(
      jsonRequest(url, 'PATCH', { quantity: 1 }),
      routeContext({ id: ID, itemId: 'x' }),
    );
    expect(res.status).toBe(400);
  });

  it('DELETE remove a entrada e responde 204', async () => {
    const res = await DELETE(jsonRequest(url, 'DELETE'), context());

    expect(res.status).toBe(204);
    expect(api.charactersApi.removeItem).toHaveBeenCalledWith(ID, SESSION_USER.id, ITEM);
  });

  it('DELETE responde 400 com itemId que não é uuid', async () => {
    const res = await DELETE(jsonRequest(url, 'DELETE'), routeContext({ id: ID, itemId: 'x' }));
    expect(res.status).toBe(400);
    expect(api.charactersApi.removeItem).not.toHaveBeenCalled();
  });
});
