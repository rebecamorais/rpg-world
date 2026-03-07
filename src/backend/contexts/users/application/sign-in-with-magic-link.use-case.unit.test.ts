import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignInWithMagicLinkUseCase } from './sign-in-with-magic-link.use-case';

describe('SignInWithMagicLinkUseCase', () => {
  it('deve chamar o repositório com o email e redirectTo corretos', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn().mockResolvedValue(undefined),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignInWithMagicLinkUseCase(mockRepository);
    await useCase.execute('test@example.com', 'http://localhost/callback');

    expect(mockRepository.signInWithOtp).toHaveBeenCalledWith(
      'test@example.com',
      'http://localhost/callback',
    );
  });

  it('deve lançar erro se o email não for fornecido', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignInWithMagicLinkUseCase(mockRepository);

    await expect(useCase.execute('', 'http://test')).rejects.toThrow(
      'Email is required',
    );
    expect(mockRepository.signInWithOtp).not.toHaveBeenCalled();
  });
});
