import {
  SESSION_USER,
  api,
  formRequest,
  jsonRequest,
  resetApi,
  routeContext,
} from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const url = `/api/characters/${ID}/avatar`;

function withFile() {
  const form = new FormData();
  form.set('file', new File(['img'], 'avatar.png', { type: 'image/png' }));
  return form;
}

describe('POST /api/characters/[id]/avatar', () => {
  beforeEach(() => resetApi());

  it('envia o arquivo em nome do usuário da sessão e devolve a URL', async () => {
    api.charactersApi.uploadAvatar.mockResolvedValue('https://images.test/avatar.png');

    const res = await POST(formRequest(url, withFile()), routeContext({ id: ID }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://images.test/avatar.png' });
    expect(api.charactersApi.uploadAvatar).toHaveBeenCalledWith(
      ID,
      SESSION_USER.id,
      expect.any(File),
    );
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await POST(formRequest(url, withFile()), routeContext({ id: ID }));

    expect(res.status).toBe(401);
    expect(api.charactersApi.uploadAvatar).not.toHaveBeenCalled();
  });

  it('responde 400 quando o corpo não é multipart', async () => {
    const res = await POST(jsonRequest(url, 'POST', { file: 'x' }), routeContext({ id: ID }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid form data' });
  });

  it('responde 400 quando falta o campo file', async () => {
    const form = new FormData();
    form.set('file', 'just text');

    const res = await POST(formRequest(url, form), routeContext({ id: ID }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing "file" field' });
  });

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await POST(formRequest(url, withFile()), routeContext({ id: 'abc' }));

    expect(res.status).toBe(400);
    expect(api.charactersApi.uploadAvatar).not.toHaveBeenCalled();
  });

  it('traduz erros de domínio do upload', async () => {
    api.charactersApi.uploadAvatar.mockRejectedValue(
      new AppError('character_error_access_forbidden', 'forbidden'),
    );

    const res = await POST(formRequest(url, withFile()), routeContext({ id: ID }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'character_error_access_forbidden' });
  });
});
