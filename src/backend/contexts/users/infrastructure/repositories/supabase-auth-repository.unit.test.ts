import { AuthError, JwtPayload, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '../../domain/UserError';
import { SupabaseAuthRepository } from './supabase-auth-repository';

vi.mock('server-only', () => ({}));

describe('SupabaseAuthRepository', () => {
  let mockAuthClient: InstanceType<typeof SupabaseClient>;
  let mockDbClient: InstanceType<typeof SupabaseClient>;
  let repository: SupabaseAuthRepository;

  beforeEach(() => {
    // Setting up deeply mocked SupabaseClients
    mockAuthClient = {
      auth: {
        getClaims: vi.fn(),
        signInWithPassword: vi.fn(),
        exchangeCodeForSession: vi.fn(),
        signOut: vi.fn(),
        updateUser: vi.fn(),
      },
    } as unknown as InstanceType<typeof SupabaseClient>;

    mockDbClient = {
      rpc: vi.fn(),
      auth: {
        admin: {
          generateLink: vi.fn(),
        },
      },
    } as unknown as InstanceType<typeof SupabaseClient>;

    repository = new SupabaseAuthRepository(mockAuthClient, mockDbClient);
  });

  const mockAuthError = (message: string, code = 'mock_error'): AuthError =>
    new AuthError(message, 400, code);

  describe('getSessionUser', () => {
    const claimsResult = (claims: Partial<JwtPayload>) =>
      ({ data: { claims, header: {}, signature: new Uint8Array() }, error: null }) as Awaited<
        ReturnType<SupabaseClient['auth']['getClaims']>
      >;

    it('deve retornar o usuário mapeado das claims do JWT', async () => {
      vi.mocked(mockAuthClient.auth.getClaims).mockResolvedValueOnce(
        claimsResult({
          sub: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test', avatar_url: 'https://x/a.png' },
        }),
      );

      const result = await repository.getSessionUser();
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test',
        avatarUrl: 'https://x/a.png',
      });
    });

    it('confere a sessão uma vez só, mesmo chamado várias vezes no mesmo pedido', async () => {
      vi.mocked(mockAuthClient.auth.getClaims).mockResolvedValue(claimsResult({ sub: 'user-123' }));

      const [first, second] = await Promise.all([
        repository.getSessionUser(),
        repository.getSessionUser(),
      ]);
      await repository.getSessionUser();

      expect(first).toEqual(second);
      expect(mockAuthClient.auth.getClaims).toHaveBeenCalledTimes(1);
    });

    it('confere de novo depois de sair da conta', async () => {
      vi.mocked(mockAuthClient.auth.getClaims).mockResolvedValue(claimsResult({ sub: 'user-123' }));
      vi.mocked(mockAuthClient.auth.signOut).mockResolvedValue({ error: null });

      await repository.getSessionUser();
      await repository.signOut();
      await repository.getSessionUser();

      expect(mockAuthClient.auth.getClaims).toHaveBeenCalledTimes(2);
    });

    it('deve retornar null se o JWT não for válido', async () => {
      vi.mocked(mockAuthClient.auth.getClaims).mockResolvedValueOnce({
        data: null,
        error: mockAuthError('invalid_jwt'),
      });

      const result = await repository.getSessionUser();
      expect(result).toBeNull();
    });

    it('deve retornar null se não houver sessão', async () => {
      vi.mocked(mockAuthClient.auth.getClaims).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await repository.getSessionUser();
      expect(result).toBeNull();
    });
  });

  describe('exchangeCodeForSession', () => {
    it('deve realizar a troca do pkce code sem erro', async () => {
      vi.mocked(mockAuthClient.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { user: {} as User, session: {} as Session },
        error: null,
      });

      await repository.exchangeCodeForSession('secret-code');
      expect(mockAuthClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('secret-code');
    });

    it('deve lançar erro caso falhe a troca', async () => {
      vi.mocked(mockAuthClient.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockAuthError('Invalid code'),
      });

      await expect(repository.exchangeCodeForSession('wrong-code')).rejects.toThrow(
        'Failed to exchange code for session: Invalid code',
      );
    });
  });

  describe('signOut', () => {
    it('deve deslogar com sucesso', async () => {
      vi.mocked(mockAuthClient.auth.signOut).mockResolvedValueOnce({
        error: null,
      });

      await repository.signOut();
      expect(mockAuthClient.auth.signOut).toHaveBeenCalledOnce();
    });

    it('deve lançar err se falhar o signOut', async () => {
      vi.mocked(mockAuthClient.auth.signOut).mockResolvedValueOnce({
        error: mockAuthError('Server disconnect'),
      });

      await expect(repository.signOut()).rejects.toThrow('Failed to sign out: Server disconnect');
    });
  });

  describe('existsByEmail', () => {
    const rpcResult = (data: boolean | null, error: { message: string } | null = null) =>
      ({ data, error }) as never;

    it('consulta o índice de e-mail pela função do banco', async () => {
      vi.mocked(mockDbClient.rpc).mockResolvedValueOnce(rpcResult(true));

      expect(await repository.existsByEmail('test@example.com')).toBe(true);
      expect(mockDbClient.rpc).toHaveBeenCalledWith('auth_user_exists', {
        p_email: 'test@example.com',
      });
    });

    it('deve retornar false se o usuário não existir', async () => {
      vi.mocked(mockDbClient.rpc).mockResolvedValueOnce(rpcResult(false));

      expect(await repository.existsByEmail('notfound@example.com')).toBe(false);
    });

    it('deve lançar erro caso falhe a busca', async () => {
      vi.mocked(mockDbClient.rpc).mockResolvedValueOnce(
        rpcResult(null, { message: 'Database unreachable' }),
      );

      await expect(repository.existsByEmail('test@example.com')).rejects.toThrow(
        'Failed to check if user exists: Database unreachable',
      );
    });
  });

  describe('mapeamento de erros esperados do Supabase Auth', () => {
    const failWith = (code: string) => ({ data: {}, error: mockAuthError(code, code) }) as never;

    it.each([
      ['invalid_credentials', UserErrorCodes.SIGNIN_INVALID_CREDENTIALS],
      // same answer as a wrong password, so it can't confirm that a sign-up created the account
      ['email_not_confirmed', UserErrorCodes.SIGNIN_INVALID_CREDENTIALS],
      ['over_request_rate_limit', UserErrorCodes.AUTH_RATE_LIMITED],
    ])('signInWithPassword: %s vira %s', async (code, expected) => {
      vi.mocked(mockAuthClient.auth.signInWithPassword).mockResolvedValueOnce(failWith(code));

      const error = await repository.signInWithPassword('a@b.co', 'x').catch((e) => e);

      expect(error).toBeInstanceOf(UserError);
      expect(error.code).toBe(expected);
    });

    it.each([
      ['weak_password', UserErrorCodes.UPDATE_PASSWORD_WEAK],
      ['same_password', UserErrorCodes.UPDATE_PASSWORD_SAME],
    ])('updatePassword: %s vira %s', async (code, expected) => {
      vi.mocked(mockAuthClient.auth.updateUser).mockResolvedValueOnce(failWith(code));
      await expect(repository.updatePassword('123456')).rejects.toThrow(expected);
    });

    it('generateRecoveryLink: user_not_found vira AUTH_USER_NOT_FOUND', async () => {
      vi.mocked(mockDbClient.auth.admin.generateLink).mockResolvedValueOnce(
        failWith('user_not_found'),
      );
      await expect(repository.generateRecoveryLink('x@y.co', '/r')).rejects.toThrow(
        UserErrorCodes.AUTH_USER_NOT_FOUND,
      );
    });

    it.each(['otp_expired', 'flow_state_expired', 'flow_state_not_found'])(
      'exchangeCodeForSession: %s vira AUTH_LINK_EXPIRED',
      async (code) => {
        vi.mocked(mockAuthClient.auth.exchangeCodeForSession).mockResolvedValueOnce(failWith(code));
        await expect(repository.exchangeCodeForSession('code')).rejects.toThrow(
          UserErrorCodes.AUTH_LINK_EXPIRED,
        );
      },
    );

    it('erros desconhecidos continuam sendo Error comum (viram 500)', async () => {
      vi.mocked(mockAuthClient.auth.signInWithPassword).mockResolvedValueOnce(
        failWith('unexpected_failure'),
      );
      const error = await repository.signInWithPassword('a@b.co', 'x').catch((e) => e);
      expect(error).not.toBeInstanceOf(UserError);
      expect(error.message).toContain('Failed to sign in with password');
    });
  });
});
