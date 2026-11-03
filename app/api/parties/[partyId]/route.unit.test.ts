import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
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

  it('guarda o link do diário sem renomear', async () => {
    const url = 'https://docs.google.com/document/d/x/edit';
    expect((await patch({ journalUrl: url })).status).toBe(204);
    expect(api.partiesApi.setJournal).toHaveBeenCalledWith(PARTY, SESSION_USER.id, url);
    expect(api.partiesApi.rename).not.toHaveBeenCalled();
  });

  it('remove o link do diário com null', async () => {
    expect((await patch({ journalUrl: null })).status).toBe(204);
    expect(api.partiesApi.setJournal).toHaveBeenCalledWith(PARTY, SESSION_USER.id, null);
  });

  it('link do diário com mais de 500 caracteres responde 400', async () => {
    expect((await patch({ journalUrl: 'x'.repeat(501) })).status).toBe(400);
    expect(api.partiesApi.setJournal).not.toHaveBeenCalled();
  });

  it('corpo vazio ou edição desconhecida responde 400', async () => {
    expect((await patch({})).status).toBe(400);
    expect((await patch({ edition: '1999' })).status).toBe(400);
    expect(api.partiesApi.rename).not.toHaveBeenCalled();
    expect(api.partiesApi.setEdition).not.toHaveBeenCalled();
  });
});
