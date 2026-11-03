import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUT } from './coins/route';
import { DELETE, PATCH } from './items/[itemId]/route';
import { POST } from './items/route';
import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const CONTAINER = '0b8f6a52-3c1d-4e7a-8d2b-5a9c7e1f4b30';
const ITEM = '9a3b1c2d-4e5f-4a6b-8c7d-0e1f2a3b4c5d';
const base = `/api/parties/${PARTY}/chest`;
const coins = { cp: 0, sp: 3, ep: 0, gp: 12, pp: 1 };

describe('/api/parties/[partyId]/chest', () => {
  beforeEach(() => resetApi());

  it('GET devolve o baú no idioma pedido', async () => {
    const chest = { containers: [], items: [] };
    api.charactersApi.getPartyChest.mockResolvedValue(chest);

    const res = await GET(jsonRequest(`${base}?locale=pt`), routeContext({ partyId: PARTY }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(chest);
    expect(api.charactersApi.getPartyChest).toHaveBeenCalledWith(PARTY, 'pt');
  });

  it('sem sessão responde 401 e não lê nada', async () => {
    resetApi(null);
    const res = await GET(jsonRequest(base), routeContext({ partyId: PARTY }));
    expect(res.status).toBe(401);
    expect(api.charactersApi.getPartyChest).not.toHaveBeenCalled();
  });

  it('POST adiciona o item ao baú', async () => {
    const input = { ref: 'dnd5e:srd-5.2:item:rope', containerId: CONTAINER, quantity: 2 };
    api.charactersApi.addPartyChestItem.mockResolvedValue({ id: ITEM, ...input });

    const res = await POST(
      jsonRequest(`${base}/items?locale=en`, 'POST', input),
      routeContext({ partyId: PARTY }),
    );

    expect(res.status).toBe(200);
    expect(api.charactersApi.addPartyChestItem).toHaveBeenCalledWith(PARTY, input, 'en');
  });

  it('PATCH muda a quantidade e DELETE tira a entrada', async () => {
    const ctx = routeContext({ partyId: PARTY, itemId: ITEM });

    const patched = await PATCH(
      jsonRequest(`${base}/items/${ITEM}`, 'PATCH', { quantity: 5 }),
      ctx,
    );
    const deleted = await DELETE(jsonRequest(`${base}/items/${ITEM}`, 'DELETE'), ctx);

    expect(patched.status).toBe(204);
    expect(deleted.status).toBe(204);
    expect(api.charactersApi.setPartyChestItemQuantity).toHaveBeenCalledWith(PARTY, ITEM, 5);
    expect(api.charactersApi.removePartyChestItem).toHaveBeenCalledWith(PARTY, ITEM);
  });

  it('PUT grava as moedas do baú', async () => {
    const res = await PUT(
      jsonRequest(`${base}/coins`, 'PUT', { containerId: CONTAINER, coins }),
      routeContext({ partyId: PARTY }),
    );

    expect(res.status).toBe(204);
    expect(api.charactersApi.setPartyChestCoins).toHaveBeenCalledWith(PARTY, CONTAINER, coins);
  });

  it('responde 400 com mesa ou entrada que não são uuid', async () => {
    const res = await PATCH(
      jsonRequest(`${base}/items/x`, 'PATCH', { quantity: 1 }),
      routeContext({ partyId: 'mesa', itemId: 'x' }),
    );
    expect(res.status).toBe(400);
    expect(api.charactersApi.setPartyChestItemQuantity).not.toHaveBeenCalled();
  });
});
