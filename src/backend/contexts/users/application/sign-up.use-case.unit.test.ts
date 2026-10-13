import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserErrorCodes } from '../domain/UserError';
import { DEFAULT_FIRST_ACCESS_PASSWORD } from '../domain/default-password';
import { SignUpUseCase } from './sign-up.use-case';

const REDIRECT = 'https://app.test/auth/confirm';

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
    await useCase.execute('test@example.com', 'Password123!', 'https://app.test/auth/confirm');

    expect(mockRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockRepository.generateSignUpLink).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
      'https://app.test/auth/confirm',
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

    await expect(useCase.execute('', 'Password123!', REDIRECT)).rejects.toThrow(
      UserErrorCodes.SIGNUP_REQUIRED_FIELDS,
    );
    await expect(useCase.execute('test@example.com', '', REDIRECT)).rejects.toThrow(
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

    await expect(
      useCase.execute('test@example.com', DEFAULT_FIRST_ACCESS_PASSWORD, REDIRECT),
    ).rejects.toThrow(UserErrorCodes.SIGNUP_INVALID_PASSWORD);
  });

  it('should throw error if email already exists', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(true),
      generateSignUpLink: vi.fn(),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(useCase.execute('existing@example.com', 'Password123!', REDIRECT)).rejects.toThrow(
      UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
    );
    expect(mockRepository.generateSignUpLink).not.toHaveBeenCalled();
    expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();
  });
});
