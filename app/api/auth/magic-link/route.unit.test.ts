import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => resetApi(null));

  it('envia o link apontando para o callback da própria origem', async () => {
    const req = jsonRequest('https://rpg.test/api/auth/magic-link', 'POST', {
      email: 'hero@example.com',
    });

    const res = await POST(req, routeContext());

    expect(res.status).toBe(200);
    expect(api.authApi.signInWithMagicLink).toHaveBeenCalledWith(
      'hero@example.com',
      'https://rpg.test/api/auth/callback',
    );
  });

  it('responde 400 sem e-mail', async () => {
    const res = await POST(jsonRequest('/api/auth/magic-link', 'POST', {}), routeContext());

    expect(res.status).toBe(400);
    expect(api.authApi.signInWithMagicLink).not.toHaveBeenCalled();
  });
});
