import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '9d2e4b61-7a3c-4f08-b5e1-2c6a8d0f3e17';
const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/parties/${PARTY}/characters/${ID}/inventory`;

describe('/api/parties/[partyId]/characters/[id]/inventory', () => {
  beforeEach(() => resetApi());

  it('GET devolve o inventário para o mestre da mesa', async () => {
    const inventory = { containers: [], items: [] };
    api.charactersApi.getInventoryForPartyGm.mockResolvedValue(inventory);

    const res = await GET(
      jsonRequest(`${url}?locale=pt`),
      routeContext({ partyId: PARTY, id: ID }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(inventory);
    expect(api.charactersApi.getInventoryForPartyGm).toHaveBeenCalledWith(
      PARTY,
      ID,
      SESSION_USER.id,
      'pt',
    );
  });

  it('GET responde 400 com ids que não são uuid', async () => {
    const res = await GET(jsonRequest(url), routeContext({ partyId: 'x', id: ID }));
    expect(res.status).toBe(400);
    expect(api.charactersApi.getInventoryForPartyGm).not.toHaveBeenCalled();
  });
});
