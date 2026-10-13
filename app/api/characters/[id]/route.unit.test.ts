import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { DELETE, GET, PUT } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}`;

describe('/api/characters/[id]', () => {
  beforeEach(() => resetApi());

  it('GET busca o personagem pelo id em nome do usuário da sessão', async () => {
    api.charactersApi.getById.mockResolvedValue({ id: ID, name: 'Hero' });

    const res = await GET(jsonRequest(url), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: ID, name: 'Hero' });
    expect(api.charactersApi.getById).toHaveBeenCalledWith(ID, SESSION_USER.id);
  });

  it('GET responde 400 quando o id não é um UUID', async () => {
    const res = await GET(jsonRequest('/api/characters/abc'), routeContext({ id: 'abc' }));

    expect(res.status).toBe(400);
    expect(api.charactersApi.getById).not.toHaveBeenCalled();
  });

  it('GET repassa o 403 quando o personagem é de outro usuário', async () => {
    api.charactersApi.getById.mockRejectedValue(
      new AppError('character_error_access_forbidden', 'forbidden'),
    );

    const res = await GET(jsonRequest(url), routeContext({ id: ID }));

    expect(res.status).toBe(403);
  });

  it('PUT atualiza só os campos validados, com o dono vindo da sessão', async () => {
    api.charactersApi.update.mockResolvedValue({ id: ID });

    const res = await PUT(
      jsonRequest(url, 'PUT', { updates: { name: 'Renamed', hpCurrent: 5, ownerUsername: 'x' } }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(200);
    expect(api.charactersApi.update).toHaveBeenCalledWith({
      id: ID,
      ownerUsername: SESSION_USER.id,
      updates: { name: 'Renamed', hpCurrent: 5 },
    });
  });

  it('PUT responde 400 com update fora dos limites', async () => {
    const res = await PUT(
      jsonRequest(url, 'PUT', { updates: { level: 21 } }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(400);
    expect(api.charactersApi.update).not.toHaveBeenCalled();
  });

  it('DELETE remove o personagem e responde 204', async () => {
    api.charactersApi.delete.mockResolvedValue({ deleted: true });

    const res = await DELETE(jsonRequest(url, 'DELETE'), routeContext({ id: ID }));

    expect(res.status).toBe(204);
    expect(api.charactersApi.delete).toHaveBeenCalledWith(ID, SESSION_USER.id);
  });
});
