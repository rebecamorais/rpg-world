import { api, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('POST /api/auth/signout', () => {
  beforeEach(() => resetApi());

  it('encerra a sessão', async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(api.authApi.signOut).toHaveBeenCalledOnce();
  });

  it('responde 500 quando o logout falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.signOut.mockRejectedValue(new Error('network'));

    const res = await POST();

    expect(res.status).toBe(500);
  });
});
