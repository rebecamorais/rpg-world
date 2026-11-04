import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { GetSessionUserUseCase } from './get-session-user.use-case';

describe('GetSessionUserUseCase', () => {
  it('deve retornar o usuário da sessão quando autenticado', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockRepository = {
      getSessionUser: vi.fn().mockResolvedValue(mockUser),
      accountExists: vi.fn().mockResolvedValue(true),
    } as unknown as AuthRepository;

    const useCase = new GetSessionUserUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.getSessionUser).toHaveBeenCalledOnce();
    expect(mockRepository.accountExists).toHaveBeenCalledWith('123');
    expect(result).toEqual(mockUser);
  });

  it('deve retornar null se não houver sessão, sem consultar o banco', async () => {
    const mockRepository = {
      getSessionUser: vi.fn().mockResolvedValue(null),
      accountExists: vi.fn(),
      signInWithPassword: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new GetSessionUserUseCase(mockRepository);
    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(mockRepository.accountExists).not.toHaveBeenCalled();
  });

  it('deve retornar null para um JWT ainda válido de uma conta já excluída', async () => {
    const mockRepository = {
      getSessionUser: vi.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
      accountExists: vi.fn().mockResolvedValue(false),
    } as unknown as AuthRepository;

    const useCase = new GetSessionUserUseCase(mockRepository);

    await expect(useCase.execute()).resolves.toBeNull();
  });
});
