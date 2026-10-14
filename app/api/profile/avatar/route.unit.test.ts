import { SESSION_USER, api, formRequest, jsonRequest, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const url = '/api/profile/avatar';

function withFile() {
  const form = new FormData();
  form.set('file', new File(['img'], 'avatar.png', { type: 'image/png' }));
  return form;
}

describe('POST /api/profile/avatar', () => {
  beforeEach(() => resetApi());

  it('envia o avatar do usuário da sessão e devolve a URL', async () => {
    api.profileApi.uploadAvatar.mockResolvedValue({
      success: true,
      avatarUrl: 'https://images.test/me.png',
    });

    const res = await POST(formRequest(url, withFile()));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://images.test/me.png' });
    expect(api.profileApi.uploadAvatar).toHaveBeenCalledWith(SESSION_USER.id, expect.any(File));
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await POST(formRequest(url, withFile()));

    expect(res.status).toBe(401);
    expect(api.profileApi.uploadAvatar).not.toHaveBeenCalled();
  });

  it('responde 400 quando o corpo não é multipart', async () => {
    const res = await POST(jsonRequest(url, 'POST', { file: 'x' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid form data' });
  });

  it('responde 400 quando falta o campo file', async () => {
    const res = await POST(formRequest(url, new FormData()));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing "file" field' });
  });

  it('traduz erros de domínio do upload', async () => {
    api.profileApi.uploadAvatar.mockRejectedValue(
      new AppError('storage_error_upload_avatar_size_limit'),
    );

    const res = await POST(formRequest(url, withFile()));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'storage_error_upload_avatar_size_limit' });
  });
});
