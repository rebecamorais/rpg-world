import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
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

  it('responde como sucesso para e-mail já cadastrado e avisa o dono, sem mexer na conta', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(true),
      generateSignUpLink: vi.fn(),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendAccountExistsEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(
      useCase.execute('existing@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();
    expect(mockRepository.generateSignUpLink).not.toHaveBeenCalled();
    expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockEmailService.sendAccountExistsEmail).toHaveBeenCalledWith(
      'existing@example.com',
      'https://app.test/forgot-password',
    );
  });

  it('dá a mesma resposta quando o e-mail é cadastrado entre a checagem e a criação', async () => {
    const mockRepository = {
      existsByEmail: vi.fn().mockResolvedValue(false),
      generateSignUpLink: vi
        .fn()
        .mockRejectedValue(new UserError(UserErrorCodes.SIGNUP_DUPLICATE_EMAIL)),
    } as unknown as AuthRepository;

    const mockEmailService = {
      sendConfirmationEmail: vi.fn(),
      sendAccountExistsEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as EmailService;

    const useCase = new SignUpUseCase(mockRepository, mockEmailService);

    await expect(
      useCase.execute('racer@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();
    expect(mockEmailService.sendAccountExistsEmail).toHaveBeenCalled();
    expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it.each([new UserError(UserErrorCodes.UPDATE_PASSWORD_WEAK), new Error('connect ECONNREFUSED')])(
    'repassa outros erros ao gerar o link (%s)',
    async (failure) => {
      const mockRepository = {
        existsByEmail: vi.fn().mockResolvedValue(false),
        generateSignUpLink: vi.fn().mockRejectedValue(failure),
      } as unknown as AuthRepository;

      const mockEmailService = {
        sendConfirmationEmail: vi.fn(),
        sendAccountExistsEmail: vi.fn(),
      } as unknown as EmailService;

      const useCase = new SignUpUseCase(mockRepository, mockEmailService);

      await expect(useCase.execute('new@example.com', 'Password123!', REDIRECT)).rejects.toBe(
        failure,
      );
      expect(mockEmailService.sendAccountExistsEmail).not.toHaveBeenCalled();
    },
  );
});
