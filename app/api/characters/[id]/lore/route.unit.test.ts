import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, PUT } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}/lore`;

describe('/api/characters/[id]/lore', () => {
  beforeEach(() => resetApi());

  it('GET devolve a lore do personagem', async () => {
    api.loreApi.getByCharacterId.mockResolvedValue({ backstory: 'Born in a tavern' });

    const res = await GET(jsonRequest(url), routeContext({ id: ID }));

    expect(await res.json()).toEqual({ backstory: 'Born in a tavern' });
    expect(api.loreApi.getByCharacterId).toHaveBeenCalledWith(ID, SESSION_USER.id);
  });

  it('GET devolve objeto vazio quando o personagem ainda não tem lore', async () => {
    api.loreApi.getByCharacterId.mockResolvedValue(null);

    const res = await GET(jsonRequest(url), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it('PUT salva só os campos de lore declarados', async () => {
    api.loreApi.update.mockResolvedValue({ backstory: 'New' });

    const res = await PUT(
      jsonRequest(url, 'PUT', { backstory: 'New', characterId: 'other' }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(200);
    expect(api.loreApi.update).toHaveBeenCalledWith(ID, SESSION_USER.id, { backstory: 'New' });
  });

  it('PUT responde 400 com texto acima do limite', async () => {
    const res = await PUT(
      jsonRequest(url, 'PUT', { age: 'x'.repeat(201) }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(400);
    expect(api.loreApi.update).not.toHaveBeenCalled();
  });
});
