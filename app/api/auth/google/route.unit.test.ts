import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const signInWithOAuth = vi.fn();

vi.mock('@backend/shared/providers/get-container', () => ({
  getContainer: async () => ({ get: () => ({ auth: { signInWithOAuth } }) }),
}));

const ORIGIN = 'https://rpg.test';

describe('GET /api/auth/google', () => {
  beforeEach(() => signInWithOAuth.mockReset());

  it('redireciona para o OAuth do Google com o callback da própria origem', async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2' },
      error: null,
    });

    const res = await GET(new Request(`${ORIGIN}/api/auth/google`));

    expect(res.headers.get('location')).toBe('https://accounts.google.com/o/oauth2');
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${ORIGIN}/api/auth/callback` },
    });
  });

  it('manda para a página de erro com um código, sem a mensagem do Supabase', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: 'Unsupported provider: provider is not enabled' },
    });

    const res = await GET(new Request(`${ORIGIN}/api/auth/google`));

    expect(res.headers.get('location')).toBe(`${ORIGIN}/auth/error?message=auth_error_provider`);
  });
});
