import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUT } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const CONTAINER = '0b8f6a52-3c1d-4e7a-8d2b-5a9c7e1f4b30';
const url = `/api/characters/${ID}/inventory/coins`;
const coins = { cp: 0, sp: 3, ep: 0, gp: 12, pp: 1 };

describe('/api/characters/[id]/inventory/coins', () => {
  beforeEach(() => resetApi());

  it('PUT grava as moedas do lugar e responde 204', async () => {
    const res = await PUT(
      jsonRequest(url, 'PUT', { containerId: CONTAINER, coins }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(204);
    expect(api.charactersApi.setCoins).toHaveBeenCalledWith(ID, SESSION_USER.id, CONTAINER, coins);
  });

  it.each([
    ['moeda negativa (Ponto 4)', { ...coins, gp: -1 }],
    ['moeda fracionada', { ...coins, gp: 1.5 }],
    ['moeda acima do teto', { ...coins, gp: 1_000_000_001 }],
    ['moeda faltando', { cp: 0, sp: 0, ep: 0, gp: 0 }],
    ['moeda a mais', { ...coins, xx: 1 }],
    ['moeda como texto', { ...coins, gp: '1' }],
  ])('PUT responde 400 com %s', async (_name, invalid) => {
    const res = await PUT(
      jsonRequest(url, 'PUT', { containerId: CONTAINER, coins: invalid }),
      routeContext({ id: ID }),
    );
    expect(res.status).toBe(400);
    expect(api.charactersApi.setCoins).not.toHaveBeenCalled();
  });

  it('PUT responde 400 com lugar que não é uuid', async () => {
    const res = await PUT(
      jsonRequest(url, 'PUT', { containerId: 'bag', coins }),
      routeContext({ id: ID }),
    );
    expect(res.status).toBe(400);
  });
});
