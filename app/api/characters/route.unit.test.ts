import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('/api/characters', () => {
  beforeEach(() => resetApi());

  it('GET lista os personagens do usuário da sessão', async () => {
    api.charactersApi.getByOwner.mockResolvedValue([{ id: 'c1' }]);

    const res = await GET(jsonRequest('/api/characters'), routeContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'c1' }]);
    expect(api.charactersApi.getByOwner).toHaveBeenCalledWith(SESSION_USER.id);
  });

  it('POST cria o personagem em nome do usuário da sessão e responde 201', async () => {
    api.charactersApi.create.mockResolvedValue({ id: 'c1' });

    const res = await POST(
      jsonRequest('/api/characters', 'POST', { name: 'Hero', level: 3, ownerUsername: 'intruder' }),
      routeContext(),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'c1' });
    expect(api.charactersApi.create).toHaveBeenCalledWith({
      name: 'Hero',
      level: 3,
      ownerUsername: SESSION_USER.id,
    });
  });

  it('POST responde 400 sem criar quando o body é inválido', async () => {
    const res = await POST(jsonRequest('/api/characters', 'POST', { level: 99 }), routeContext());

    expect(res.status).toBe(400);
    expect(api.charactersApi.create).not.toHaveBeenCalled();
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET(jsonRequest('/api/characters'), routeContext());

    expect(res.status).toBe(401);
    expect(api.charactersApi.getByOwner).not.toHaveBeenCalled();
  });
});
