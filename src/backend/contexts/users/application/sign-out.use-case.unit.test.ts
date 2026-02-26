import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignOutUseCase } from './sign-out.use-case';

describe('SignOutUseCase', () => {
  it('deve acionar o método signOut no repositório', async () => {
    const mockRepository: AuthRepository = {
      getSessionUser: vi.fn(),
      signInWithOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new SignOutUseCase(mockRepository);
    await useCase.execute();

    expect(mockRepository.signOut).toHaveBeenCalledOnce();
  });
});
