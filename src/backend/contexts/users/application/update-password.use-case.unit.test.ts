import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { UpdatePasswordUseCase } from './update-password.use-case';

describe('UpdatePasswordUseCase', () => {
  it('deve chamar o repositório para atualizar a senha', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
    };

    const useCase = new UpdatePasswordUseCase(mockRepository);
    await useCase.execute('newPassword123');

    expect(mockRepository.updatePassword).toHaveBeenCalledWith('newPassword123');
  });

  it('deve lançar erro se a nova senha não for fornecida', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new UpdatePasswordUseCase(mockRepository);

    await expect(useCase.execute('')).rejects.toThrow('Nova senha é obrigatória');
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });
});
