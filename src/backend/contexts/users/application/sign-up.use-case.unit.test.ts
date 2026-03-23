import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserErrorCodes } from '../domain/UserError';
import { SignUpUseCase } from './sign-up.use-case';

describe('SignUpUseCase', () => {
  it('should call repository with correct credentials and send email', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(false),
      generateSignUpLink: vi.fn().mockResolvedValue('http://mock-link'),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn(),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);
    await useCase.execute('test@example.com', 'Password123!');

    expect(mockRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockRepository.generateSignUpLink).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
      expect.any(String),
    );
    expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'http://mock-link',
    );
  });

  it('should throw error if email or password are not provided', async () => {
    const mockRepository = {
      existsByEmail: vi.fn(),
      generateSignUpLink: vi.fn(),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(useCase.execute('', 'Password123!')).rejects.toThrow(
      UserErrorCodes.SIGNUP_REQUIRED_FIELDS,
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      UserErrorCodes.SIGNUP_REQUIRED_FIELDS,
    );
    expect(mockRepository.generateSignUpLink).not.toHaveBeenCalled();
  });

  it('should throw error if default reset password is used', async () => {
    const mockRepository = {
      existsByEmail: vi.fn(),
      generateSignUpLink: vi.fn(),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(useCase.execute('test@example.com', '123MudarASenha@')).rejects.toThrow(
      UserErrorCodes.SIGNUP_INVALID_PASSWORD,
    );
  });

  it('should throw error if email already exists', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(true),
      generateSignUpLink: vi.fn(),
      signUp: vi.fn(),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(useCase.execute('existing@example.com', 'Password123!')).rejects.toThrow(
      UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
    );
    expect(mockRepository.signUp).not.toHaveBeenCalled();
  });
});
