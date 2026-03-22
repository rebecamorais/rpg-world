import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { UpdatePasswordUseCase } from './update-password.use-case';

describe('UpdatePasswordUseCase', () => {
  it('deve chamar o repositório para atualizar a senha', async () => {
    const mockRepository = {
      updatePassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new UpdatePasswordUseCase(mockRepository);
    await useCase.execute('newPassword123');

    expect(mockRepository.updatePassword).toHaveBeenCalledWith('newPassword123');
  });

  it('deve lançar erro se a nova senha não for fornecida', async () => {
    const mockRepository = {
      updatePassword: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new UpdatePasswordUseCase(mockRepository);

    await expect(useCase.execute('')).rejects.toThrow('auth_error_update_password_required');
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });
});
