import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignInWithPasswordUseCase } from './sign-in-with-password.use-case';

describe('SignInWithPasswordUseCase', () => {
  it('deve chamar o repositório com as credenciais corretas', async () => {
    const mockRepository = {
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new SignInWithPasswordUseCase(mockRepository);
    await useCase.execute('test@example.com', 'password123');

    expect(mockRepository.signInWithPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
    );
  });

  it('deve retornar passwordChangeRequired verdadeiro se a senha for a padrão', async () => {
    const mockRepository = {
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new SignInWithPasswordUseCase(mockRepository);
    const result = await useCase.execute('test@example.com', '123MudaASenha@');

    expect(result.passwordChangeRequired).toBe(true);
  });

  it('deve retornar passwordChangeRequired falso se a senha não for a padrão', async () => {
    const mockRepository = {
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new SignInWithPasswordUseCase(mockRepository);
    const result = await useCase.execute('test@example.com', 'outraSenha');

    expect(result.passwordChangeRequired).toBe(false);
  });

  it('deve lançar erro se o email ou senha não forem fornecidos', async () => {
    const mockRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new SignInWithPasswordUseCase(mockRepository);

    await expect(useCase.execute('', 'password123')).rejects.toThrow(
      'auth_error_signin_required_fields',
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      'auth_error_signin_required_fields',
    );
    expect(mockRepository.signInWithPassword).not.toHaveBeenCalled();
  });
});
