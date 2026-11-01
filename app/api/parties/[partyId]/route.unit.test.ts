import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const patch = (body: unknown) =>
  PATCH(jsonRequest(`/api/parties/${PARTY}`, 'PATCH', body), routeContext({ partyId: PARTY }));

describe('PATCH /api/parties/[partyId]', () => {
  beforeEach(() => resetApi());

  it('troca só a edição', async () => {
    expect((await patch({ edition: '2014' })).status).toBe(204);
    expect(api.partiesApi.setEdition).toHaveBeenCalledWith(PARTY, '2014');
    expect(api.partiesApi.rename).not.toHaveBeenCalled();
  });

  it('troca nome e edição juntos', async () => {
    expect((await patch({ name: 'Nova', edition: '2024' })).status).toBe(204);
    expect(api.partiesApi.rename).toHaveBeenCalledWith(PARTY, 'Nova');
    expect(api.partiesApi.setEdition).toHaveBeenCalledWith(PARTY, '2024');
  });

  it('corpo vazio ou edição desconhecida responde 400', async () => {
    expect((await patch({})).status).toBe(400);
    expect((await patch({ edition: '1999' })).status).toBe(400);
    expect(api.partiesApi.rename).not.toHaveBeenCalled();
    expect(api.partiesApi.setEdition).not.toHaveBeenCalled();
  });
});
