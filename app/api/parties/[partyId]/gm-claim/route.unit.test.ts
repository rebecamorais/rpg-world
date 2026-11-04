import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, PATCH, POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/parties/${PARTY}/gm-claim`;
const ctx = () => routeContext({ partyId: PARTY });

describe('/api/parties/[partyId]/gm-claim', () => {
  beforeEach(() => resetApi());

  describe('POST (pedir)', () => {
    it('devolve o status do pedido', async () => {
      api.partiesApi.claimGm.mockResolvedValue({ status: 'pending' });

      const res = await POST(jsonRequest(url, 'POST'), ctx());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'pending' });
      expect(api.partiesApi.claimGm).toHaveBeenCalledWith(PARTY);
    });

    it('sem sessão responde 401', async () => {
      resetApi(null);

      expect((await POST(jsonRequest(url, 'POST'), ctx())).status).toBe(401);
      expect(api.partiesApi.claimGm).not.toHaveBeenCalled();
    });
  });

  describe('PATCH (votar)', () => {
    it.each([true, false])('accept=%s chega ao caso de uso', async (accept) => {
      api.partiesApi.voteGmClaim.mockResolvedValue({ status: 'approved' });

      const res = await PATCH(jsonRequest(url, 'PATCH', { accept }), ctx());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'approved' });
      expect(api.partiesApi.voteGmClaim).toHaveBeenCalledWith(PARTY, accept);
    });

    it.each([{}, { accept: null }, { accept: 'true' }, { accept: 1 }])(
      'corpo %j responde 400: o voto precisa ser um booleano de verdade',
      async (body) => {
        expect((await PATCH(jsonRequest(url, 'PATCH', body), ctx())).status).toBe(400);
        expect(api.partiesApi.voteGmClaim).not.toHaveBeenCalled();
      },
    );

    it('sem sessão responde 401', async () => {
      resetApi(null);

      expect((await PATCH(jsonRequest(url, 'PATCH', { accept: true }), ctx())).status).toBe(401);
    });
  });

  describe('DELETE (desistir)', () => {
    it('devolve o status', async () => {
      api.partiesApi.cancelGmClaim.mockResolvedValue({ status: 'cancelled' });

      const res = await DELETE(jsonRequest(url, 'DELETE'), ctx());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'cancelled' });
      expect(api.partiesApi.cancelGmClaim).toHaveBeenCalledWith(PARTY);
    });

    it('sem sessão responde 401', async () => {
      resetApi(null);

      expect((await DELETE(jsonRequest(url, 'DELETE'), ctx())).status).toBe(401);
    });
  });
});
