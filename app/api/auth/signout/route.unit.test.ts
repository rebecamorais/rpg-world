import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('POST /api/auth/signout', () => {
  beforeEach(() => resetApi());

  it('encerra a sessão', async () => {
    const res = await POST(jsonRequest('/api/auth/signout', 'POST'), routeContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(api.authApi.signOut).toHaveBeenCalledOnce();
  });

  it('responde 500 genérico, sem a mensagem interna, quando o logout falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.signOut.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5'));

    const res = await POST(jsonRequest('/api/auth/signout', 'POST'), routeContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'common_error_unexpected' });
  });
});
