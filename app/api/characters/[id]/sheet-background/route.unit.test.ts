import { SESSION_USER, api, formRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}/sheet-background`;

function withFile() {
  const form = new FormData();
  form.set('file', new File(['img'], 'art.webp', { type: 'image/webp' }));
  return form;
}

describe('POST /api/characters/[id]/sheet-background', () => {
  beforeEach(() => resetApi());

  it('envia o arquivo em nome do usuário da sessão e devolve a URL', async () => {
    api.charactersApi.uploadSheetBackground.mockResolvedValue('https://images.test/art.webp');

    const res = await POST(formRequest(url, withFile()), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://images.test/art.webp' });
    expect(api.charactersApi.uploadSheetBackground).toHaveBeenCalledWith(
      ID,
      SESSION_USER.id,
      expect.any(File),
    );
  });

  it('responde 401 sem sessão', async () => {
    api.authApi.getSessionUser.mockResolvedValue(null);

    const res = await POST(formRequest(url, withFile()), routeContext({ id: ID }));

    expect(res.status).toBe(401);
    expect(api.charactersApi.uploadSheetBackground).not.toHaveBeenCalled();
  });

  it('responde 400 sem arquivo', async () => {
    const res = await POST(formRequest(url, new FormData()), routeContext({ id: ID }));

    expect(res.status).toBe(400);
  });
});
