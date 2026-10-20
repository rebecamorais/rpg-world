import { api, resetApi } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '@backend/contexts/users/domain/UserError';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const ORIGIN = 'https://rpg.test';

async function confirm(query: string) {
  const res = await GET(new Request(`${ORIGIN}/api/auth/confirm?${query}`));
  return { status: res.status, location: res.headers.get('location') };
}

describe('GET /api/auth/confirm', () => {
  beforeEach(() => resetApi(null));

  it('confirma o cadastro e leva para os personagens', async () => {
    const { status, location } = await confirm('token_hash=abc&type=signup');

    expect(status).toBe(307);
    expect(location).toBe(`${ORIGIN}/characters`);
    expect(api.authApi.verifyEmailLink).toHaveBeenCalledWith('abc', 'signup');
  });

  it('valida o link de recuperação e leva para a troca de senha', async () => {
    const { location } = await confirm('token_hash=abc&type=recovery');

    expect(location).toBe(`${ORIGIN}/reset-password`);
    expect(api.authApi.verifyEmailLink).toHaveBeenCalledWith('abc', 'recovery');
  });

  it('entra com o link mágico e leva para os personagens', async () => {
    const { location } = await confirm('token_hash=abc&type=magiclink');

    expect(location).toBe(`${ORIGIN}/characters`);
    expect(api.authApi.verifyEmailLink).toHaveBeenCalledWith('abc', 'magiclink');
  });

  it('ignora um destino vindo na URL', async () => {
    const { location } = await confirm(
      `token_hash=abc&type=signup&next=${encodeURIComponent('https://evil.com')}`,
    );

    expect(location).toBe(`${ORIGIN}/characters`);
  });

  it.each(['', 'type=signup', 'token_hash=abc', 'token_hash=abc&type=invite'])(
    'manda para a página de erro sem verificar nada quando a URL é "%s"',
    async (query) => {
      const { location } = await confirm(query);

      expect(location).toBe(`${ORIGIN}/auth/error?message=no_code_provided`);
      expect(api.authApi.verifyEmailLink).not.toHaveBeenCalled();
    },
  );

  it('repassa o código de erro esperado quando o link expirou ou já foi usado', async () => {
    api.authApi.verifyEmailLink.mockRejectedValue(new UserError(UserErrorCodes.AUTH_LINK_EXPIRED));

    const { location } = await confirm('token_hash=abc&type=signup');

    expect(location).toBe(`${ORIGIN}/auth/error?message=auth_error_link_expired`);
  });

  it('não coloca a mensagem de um erro inesperado na URL', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.verifyEmailLink.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5'));

    const { location } = await confirm('token_hash=abc&type=recovery');

    expect(location).toBe(`${ORIGIN}/auth/error?message=common_error_unexpected`);
  });
});
