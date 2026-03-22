import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../domain/AuthRepository';
import { SignUpUseCase } from './sign-up.use-case';

describe('SignUpUseCase', () => {
  it('should call repository with correct credentials', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(false),
      signUp: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;

    const useCase = new SignUpUseCase(mockRepository);
    await useCase.execute('test@example.com', 'Password123!');

    expect(mockRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockRepository.signUp).toHaveBeenCalledWith('test@example.com', 'Password123!');
  });

  it('should throw error if email or password are not provided', async () => {
    const mockRepository = {
      existsByEmail: vi.fn(),
      signUp: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new SignUpUseCase(mockRepository);

    await expect(useCase.execute('', 'Password123!')).rejects.toThrow(
      'auth_error_signup_required_fields',
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      'auth_error_signup_required_fields',
    );
    expect(mockRepository.signUp).not.toHaveBeenCalled();
  });

  it('should throw error if default reset password is used', async () => {
    const mockRepository = {
      existsByEmail: vi.fn(),
      signUp: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new SignUpUseCase(mockRepository);

    await expect(useCase.execute('test@example.com', '123MudarASenha@')).rejects.toThrow(
      'auth_error_signup_invalid_password',
    );
  });

  it('should throw error if email already exists', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(true),
      signUp: vi.fn(),
    } as unknown as AuthRepository;

    const useCase = new SignUpUseCase(mockRepository);

    await expect(useCase.execute('existing@example.com', 'Password123!')).rejects.toThrow(
      'auth_error_signup_duplicate_email',
    );
    expect(mockRepository.signUp).not.toHaveBeenCalled();
  });
});
