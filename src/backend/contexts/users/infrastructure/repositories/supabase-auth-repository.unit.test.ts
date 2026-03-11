import { AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupabaseAuthRepository } from './supabase-auth-repository';

vi.mock('server-only', () => ({}));

describe('SupabaseAuthRepository', () => {
  let mockAuthClient: InstanceType<typeof SupabaseClient>;
  let repository: SupabaseAuthRepository;

  beforeEach(() => {
    // Setting up a deeply mocked SupabaseClient
    mockAuthClient = {
      auth: {
        getUser: vi.fn(),
        signInWithOtp: vi.fn(),
        exchangeCodeForSession: vi.fn(),
        signOut: vi.fn(),
      },
    } as unknown as InstanceType<typeof SupabaseClient>;

    repository = new SupabaseAuthRepository(mockAuthClient);
  });

  const mockAuthError = (message: string): AuthError => new AuthError(message, 400, 'mock_error');

  describe('getSessionUser', () => {
    it('deve retornar o usuário mapeado quando sucesso', async () => {
      vi.mocked(mockAuthClient.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@example.com' } as User },
        error: null,
      });

      const result = await repository.getSessionUser();
      expect(result).toEqual({ id: 'user-123', email: 'test@example.com' });
    });

    it('deve retornar null se houver erro ao buscar o usuário', async () => {
      vi.mocked(mockAuthClient.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: mockAuthError('Auth error'),
      });

      const result = await repository.getSessionUser();
      expect(result).toBeNull();
    });

    it('deve retornar null se não houver erro, mas usuário for nulo', async () => {
      vi.mocked(mockAuthClient.auth.getUser).mockResolvedValueOnce({
        data: { user: null as unknown as User },
        error: null,
      });

      const result = await repository.getSessionUser();
      expect(result).toBeNull();
    });
  });

  describe('signInWithOtp', () => {
    it('deve repassar credenciais corretamente pro client', async () => {
      vi.mocked(mockAuthClient.auth.signInWithOtp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      });

      await repository.signInWithOtp('test@example.com', 'redirect/path');
      expect(mockAuthClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { emailRedirectTo: 'redirect/path' },
      });
    });

    it('deve lançar erro caso falhe', async () => {
      vi.mocked(mockAuthClient.auth.signInWithOtp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockAuthError('Rate limit exceeded'),
      });

      await expect(repository.signInWithOtp('t@example.com', '/path')).rejects.toThrow(
        'Failed to sign in with OTP: Rate limit exceeded',
      );
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
});
