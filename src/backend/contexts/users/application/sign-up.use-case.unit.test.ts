import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignUpUseCase } from './sign-up.use-case';

describe('SignUpUseCase', () => {
  it('should call repository with correct credentials', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn().mockResolvedValue(undefined),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignUpUseCase(mockRepository);
    await useCase.execute('test@example.com', 'Password123!');

    expect(mockRepository.signUp).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
  });

  it('should throw error if email or password are not provided', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignUpUseCase(mockRepository);

    await expect(useCase.execute('', 'Password123!')).rejects.toThrow(
      'Email e senha são obrigatórios',
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      'Email e senha são obrigatórios',
    );
    expect(mockRepository.signUp).not.toHaveBeenCalled();
  });

  it('should throw error if default reset password is used', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignUpUseCase(mockRepository);

    await expect(useCase.execute('test@example.com', '123MudarASenha@')).rejects.toThrow(
      'Esta senha não pode ser utilizada para cadastro inicial.',
    );
  });
});
