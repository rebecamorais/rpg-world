import {
  SESSION_USER,
  api,
  formRequest,
  jsonRequest,
  resetApi,
  routeContext,
} from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/parties/${PARTY}/image`;

function withFile() {
  const form = new FormData();
  form.set('file', new File(['img'], 'mesa.webp', { type: 'image/webp' }));
  return form;
}

describe('/api/parties/[partyId]/image', () => {
  beforeEach(() => resetApi());

  it('POST envia em nome do usuário da sessão e devolve a URL', async () => {
    api.partiesApi.uploadImage.mockResolvedValue({ url: 'https://images.test/mesa.webp' });

    const res = await POST(formRequest(url, withFile()), routeContext({ partyId: PARTY }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://images.test/mesa.webp' });
    expect(api.partiesApi.uploadImage).toHaveBeenCalledWith(
      PARTY,
      SESSION_USER.id,
      expect.any(File),
    );
  });

  it('POST responde 401 sem sessão e 400 sem arquivo ou com mesa inválida', async () => {
    resetApi(null);
    expect(
      (await POST(formRequest(url, withFile()), routeContext({ partyId: PARTY }))).status,
    ).toBe(401);

    resetApi();
    expect(
      (await POST(formRequest(url, new FormData()), routeContext({ partyId: PARTY }))).status,
    ).toBe(400);
    expect((await POST(formRequest(url, withFile()), routeContext({ partyId: 'x' }))).status).toBe(
      400,
    );
    expect(api.partiesApi.uploadImage).not.toHaveBeenCalled();
  });

  it('DELETE remove a imagem', async () => {
    const res = await DELETE(jsonRequest(url, 'DELETE'), routeContext({ partyId: PARTY }));

    expect(res.status).toBe(204);
    expect(api.partiesApi.removeImage).toHaveBeenCalledWith(PARTY, SESSION_USER.id);
  });
});
