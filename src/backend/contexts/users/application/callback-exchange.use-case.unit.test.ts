import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { CallbackExchangeUseCase } from './callback-exchange.use-case';

describe('CallbackExchangeUseCase', () => {
  it('deve chamar o repositório com o código correto', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
    };

    const useCase = new CallbackExchangeUseCase(mockRepository);
    await useCase.execute('valid-auth-code');

    expect(mockRepository.exchangeCodeForSession).toHaveBeenCalledWith(
      'valid-auth-code',
    );
  });

  it('deve lançar erro se o código não for preenchido', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new CallbackExchangeUseCase(mockRepository);

    await expect(useCase.execute('')).rejects.toThrow('Code is required');
    expect(mockRepository.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
