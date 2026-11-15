import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH, PUT } from './route';

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

  it('PATCH soma a diferença com a chave e devolve as moedas', async () => {
    const key = '3d2c1b0a-9f8e-4d7c-8b6a-5f4e3d2c1b0a';
    api.charactersApi.changeCoins.mockResolvedValue({ coins });

    const res = await PATCH(
      jsonRequest(url, 'PATCH', { containerId: CONTAINER, delta: { gp: 2, sp: -1 }, key }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ coins });
    expect(api.charactersApi.changeCoins).toHaveBeenCalledWith(ID, SESSION_USER.id, CONTAINER, {
      delta: { gp: 2, sp: -1 },
      key,
    });
  });

  it('PATCH com a moeda digitada manda o valor final e o que a tela mostrava', async () => {
    const key = '3d2c1b0a-9f8e-4d7c-8b6a-5f4e3d2c1b0a';
    api.charactersApi.changeCoins.mockResolvedValue({ coins });

    const res = await PATCH(
      jsonRequest(url, 'PATCH', {
        containerId: CONTAINER,
        coins: { gp: 70 },
        expected: { gp: 50 },
        key,
      }),
      routeContext({ id: ID }),
    );

    expect(res.status).toBe(200);
    expect(api.charactersApi.changeCoins).toHaveBeenCalledWith(ID, SESSION_USER.id, CONTAINER, {
      coins: { gp: 70 },
      expected: { gp: 50 },
      key,
    });
  });

  it.each([
    ['moedas diferentes no valor e no esperado', { coins: { gp: 70 }, expected: { sp: 50 } }],
    ['nenhuma moeda', { coins: {}, expected: {} }],
    ['sem o esperado', { coins: { gp: 70 } }],
    ['valor negativo', { coins: { gp: -1 }, expected: { gp: 50 } }],
  ])('PATCH responde 400 com %s', async (_name, typed) => {
    const res = await PATCH(
      jsonRequest(url, 'PATCH', {
        containerId: CONTAINER,
        key: '3d2c1b0a-9f8e-4d7c-8b6a-5f4e3d2c1b0a',
        ...typed,
      }),
      routeContext({ id: ID }),
    );
    expect(res.status).toBe(400);
    expect(api.charactersApi.changeCoins).not.toHaveBeenCalled();
  });
});
