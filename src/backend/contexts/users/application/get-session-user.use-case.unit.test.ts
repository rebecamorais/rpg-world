import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { GetSessionUserUseCase } from './get-session-user.use-case';

describe('GetSessionUserUseCase', () => {
  it('deve retornar o usuário da sessão quando autenticado', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn().mockResolvedValue(mockUser),
      signInWithOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new GetSessionUserUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.getSessionUser).toHaveBeenCalledOnce();
    expect(result).toEqual(mockUser);
  });

  it('deve retornar null se não houver sessão', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn().mockResolvedValue(null),
      signInWithOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    };

    const useCase = new GetSessionUserUseCase(mockRepository);
    const result = await useCase.execute();

    expect(result).toBeNull();
  });
});
