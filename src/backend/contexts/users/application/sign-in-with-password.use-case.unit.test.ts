import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignInWithPasswordUseCase } from './sign-in-with-password.use-case';

describe('SignInWithPasswordUseCase', () => {
  it('deve chamar o repositório com as credenciais corretas', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignInWithPasswordUseCase(mockRepository);
    await useCase.execute('test@example.com', 'password123');

    expect(mockRepository.signInWithPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
    );
  });

  it('deve lançar erro se o email ou senha não forem fornecidos', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new SignInWithPasswordUseCase(mockRepository);

    await expect(useCase.execute('', 'password123')).rejects.toThrow(
      'Email e senha são obrigatórios',
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      'Email e senha são obrigatórios',
    );
    expect(mockRepository.signInWithPassword).not.toHaveBeenCalled();
  });
});
