import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignInWithMagicLinkUseCase } from './sign-in-with-magic-link.use-case';

describe('SignInWithMagicLinkUseCase', () => {
  it('deve chamar o repositório com o email e redirectTo corretos', async () => {
    const mockRepository = {
      signInWithOtp: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new SignInWithMagicLinkUseCase(mockRepository);
    await useCase.execute('test@example.com', 'http://localhost/callback');

    expect(mockRepository.signInWithOtp).toHaveBeenCalledWith(
      'test@example.com',
      'http://localhost/callback',
    );
  });

  it('deve lançar erro se o email não for fornecido', async () => {
    const mockRepository = {
      signInWithOtp: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new SignInWithMagicLinkUseCase(mockRepository);

    await expect(useCase.execute('', 'http://test')).rejects.toThrow(
      'auth_error_signin_magic_link_email_required',
    );
    expect(mockRepository.signInWithOtp).not.toHaveBeenCalled();
  });
});
