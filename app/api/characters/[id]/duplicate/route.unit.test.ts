import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}/duplicate`;

describe('/api/characters/[id]/duplicate', () => {
  beforeEach(() => resetApi());

  it('POST duplica a ficha com o nome pedido e responde 201 com o id da cópia', async () => {
    api.charactersApi.duplicate.mockResolvedValue({ id: 'copy-1' });

    const res = await POST(
      jsonRequest(url, 'POST', { name: 'Goblin (cópia)' }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'copy-1' });
    expect(api.charactersApi.duplicate).toHaveBeenCalledWith(ID, 'Goblin (cópia)');
  });

  it('POST responde 400 sem nome, e 401 sem sessão', async () => {
    const invalid = await POST(jsonRequest(url, 'POST', {}), routeContext({ id: ID }));
    expect(invalid.status).toBe(400);

    resetApi(null);
    const anonymous = await POST(jsonRequest(url, 'POST', { name: 'X' }), routeContext({ id: ID }));
    expect(anonymous.status).toBe(401);
    expect(api.charactersApi.duplicate).not.toHaveBeenCalled();
    expect(SESSION_USER.id).toBeTruthy();
  });
});
