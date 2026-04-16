import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { ProfileRepository } from '../domain/ProfileRepository';
import { CallbackExchangeUseCase } from './callback-exchange.use-case';

describe('CallbackExchangeUseCase', () => {
  it('deve chamar o repositório com o código correto e criar perfil se não existir', async () => {
    const mockAuthRepository = {
      exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
      getSessionUser: vi.fn().mockResolvedValue({
        id: 'user-123',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      }),
    } as unknown as AuthRepository;

    const mockProfileRepository = {
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProfileRepository;

    const useCase = new CallbackExchangeUseCase(mockAuthRepository, mockProfileRepository);
    await useCase.execute('valid-auth-code');

    expect(mockAuthRepository.exchangeCodeForSession).toHaveBeenCalledWith('valid-auth-code');
    expect(mockAuthRepository.getSessionUser).toHaveBeenCalled();
    expect(mockProfileRepository.getById).toHaveBeenCalledWith('user-123');
    expect(mockProfileRepository.create).toHaveBeenCalledWith({
      id: 'user-123',
      fullName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('não deve criar perfil se ele já existir', async () => {
    const mockAuthRepository = {
      exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
      getSessionUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
    } as unknown as AuthRepository;

    const mockProfileRepository = {
      getById: vi.fn().mockResolvedValue({ id: 'user-123' }),
      create: vi.fn(),
    } as unknown as ProfileRepository;

    const useCase = new CallbackExchangeUseCase(mockAuthRepository, mockProfileRepository);
    await useCase.execute('valid-auth-code');

    expect(mockProfileRepository.getById).toHaveBeenCalledWith('user-123');
    expect(mockProfileRepository.create).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o código não for preenchido', async () => {
    const mockAuthRepository = {
      exchangeCodeForSession: vi.fn(),
    } as unknown as AuthRepository;
    const mockProfileRepository = {} as unknown as ProfileRepository;

    const useCase = new CallbackExchangeUseCase(mockAuthRepository, mockProfileRepository);

    await expect(useCase.execute('')).rejects.toThrow('auth_error_code_required');
    expect(mockAuthRepository.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
