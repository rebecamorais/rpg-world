import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CharacterError,
  CharacterErrorCodes,
} from '@backend/contexts/characters/domain/CharacterError';

import { PATCH } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const CHEST = '0b8f6a52-3c1d-4e7a-8d2b-5a9c7e1f4b30';
const KEY = '3d2c1b0a-9f8e-4d7c-8b6a-5f4e3d2c1b0a';
const url = `/api/parties/${PARTY}/chest/coins`;
const coins = { cp: 0, sp: 0, ep: 0, gp: 55, pp: 0 };
const typed = { containerId: CHEST, coins: { gp: 70 }, expected: { gp: 50 }, key: KEY };

describe('/api/parties/[partyId]/chest/coins', () => {
  beforeEach(() => resetApi());

  it('PATCH com delta soma (Pagar, Receber)', async () => {
    api.charactersApi.changePartyChestCoins.mockResolvedValue({ coins });

    const res = await PATCH(
      jsonRequest(url, 'PATCH', { containerId: CHEST, delta: { gp: 5 }, key: KEY }),
      routeContext({ partyId: PARTY }),
    );

    expect(res.status).toBe(200);
    expect(api.charactersApi.changePartyChestCoins).toHaveBeenCalledWith(PARTY, CHEST, {
      delta: { gp: 5 },
      key: KEY,
    });
  });

  it('PATCH com a moeda digitada manda o valor final e o que a tela mostrava', async () => {
    api.charactersApi.changePartyChestCoins.mockResolvedValue({ coins });

    await PATCH(jsonRequest(url, 'PATCH', typed), routeContext({ partyId: PARTY }));

    expect(api.charactersApi.changePartyChestCoins).toHaveBeenCalledWith(PARTY, CHEST, {
      coins: { gp: 70 },
      expected: { gp: 50 },
      key: KEY,
    });
  });

  // Someone changed the chest after the person started typing: nothing is written, and the 409
  // says what the coins are now
  it('mudou em outro lugar: 409 com as moedas de agora', async () => {
    api.charactersApi.changePartyChestCoins.mockRejectedValue(
      new CharacterError(CharacterErrorCodes.COINS_CHANGED, { coins }),
    );

    const res = await PATCH(jsonRequest(url, 'PATCH', typed), routeContext({ partyId: PARTY }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: CharacterErrorCodes.COINS_CHANGED, coins });
  });
});
