import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const url = '/api/auth/update-password';

describe('POST /api/auth/update-password', () => {
  beforeEach(() => resetApi());

  it('troca a senha do usuário logado', async () => {
    api.authApi.updatePassword.mockResolvedValue({ success: true });

    const res = await POST(jsonRequest(url, 'POST', { newPassword: 'new-secret' }), routeContext());

    expect(res.status).toBe(200);
    expect(api.authApi.updatePassword).toHaveBeenCalledWith('new-secret');
  });

  it('responde 400 com senha curta demais', async () => {
    const res = await POST(jsonRequest(url, 'POST', { newPassword: '123' }), routeContext());

    expect(res.status).toBe(400);
    expect(api.authApi.updatePassword).not.toHaveBeenCalled();
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await POST(jsonRequest(url, 'POST', { newPassword: 'new-secret' }), routeContext());

    expect(res.status).toBe(401);
    expect(api.authApi.updatePassword).not.toHaveBeenCalled();
  });
});
