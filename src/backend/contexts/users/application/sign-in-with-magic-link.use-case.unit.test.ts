import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { SignInWithMagicLinkUseCase } from './sign-in-with-magic-link.use-case';

const CONFIRM_URL = 'https://app.test/api/auth/confirm';

function setup(exists: boolean) {
  const repository = {
    existsByEmail: vi.fn().mockResolvedValue(exists),
    generateMagicLink: vi.fn().mockResolvedValue('https://app.test/api/auth/confirm?token_hash=t'),
  };
  const emailService = { sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) };
  const useCase = new SignInWithMagicLinkUseCase(
    repository as unknown as AuthRepository,
    emailService as unknown as EmailService,
  );
  return { repository, emailService, useCase };
}

describe('SignInWithMagicLinkUseCase', () => {
  it('manda o link de acesso para uma conta existente', async () => {
    const { repository, emailService, useCase } = setup(true);

    await useCase.execute('hero@example.com', CONFIRM_URL);

    expect(repository.generateMagicLink).toHaveBeenCalledWith('hero@example.com', CONFIRM_URL);
    expect(emailService.sendMagicLinkEmail).toHaveBeenCalledWith(
      'hero@example.com',
      'https://app.test/api/auth/confirm?token_hash=t',
    );
  });

  it('responde igual para e-mail desconhecido, sem criar conta nem mandar e-mail', async () => {
    const { repository, emailService, useCase } = setup(false);

    await expect(useCase.execute('ghost@example.com', CONFIRM_URL)).resolves.toBeUndefined();

    expect(repository.generateMagicLink).not.toHaveBeenCalled();
    expect(emailService.sendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o email não for fornecido', async () => {
    const { repository, useCase } = setup(true);

    await expect(useCase.execute('', CONFIRM_URL)).rejects.toThrow(
      'auth_error_signin_magic_link_email_required',
    );
    expect(repository.existsByEmail).not.toHaveBeenCalled();
  });
});
