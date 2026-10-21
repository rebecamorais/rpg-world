import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const SPELL_ID = 'dnd5e:srd-5.1:spell:fireball';
const url = `/api/characters/${ID}/spells`;

describe('/api/characters/[id]/spells', () => {
  beforeEach(() => resetApi());

  it('GET lista as magias do personagem no idioma pedido', async () => {
    api.charactersApi.getSpells.mockResolvedValue([]);

    const res = await GET(jsonRequest(`${url}?locale=pt`), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(api.charactersApi.getSpells).toHaveBeenCalledWith(ID, SESSION_USER.id, 'pt');
  });

  it('GET usa inglês quando não há locale na query', async () => {
    api.charactersApi.getSpells.mockResolvedValue([]);

    await GET(jsonRequest(url), routeContext({ id: ID }));

    expect(api.charactersApi.getSpells).toHaveBeenCalledWith(ID, SESSION_USER.id, 'en');
  });

  it('POST aplica a ação na magia em nome do usuário da sessão', async () => {
    const res = await POST(
      jsonRequest(url, 'POST', { id: SPELL_ID, action: 'prepare' }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(api.charactersApi.toggleSpell).toHaveBeenCalledWith(
      ID,
      SESSION_USER.id,
      SPELL_ID,
      'prepare',
    );
  });

  it('POST responde 400 com uma ação desconhecida', async () => {
    const res = await POST(
      jsonRequest(url, 'POST', { id: SPELL_ID, action: 'cast' }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(400);
    expect(api.charactersApi.toggleSpell).not.toHaveBeenCalled();
  });
});
