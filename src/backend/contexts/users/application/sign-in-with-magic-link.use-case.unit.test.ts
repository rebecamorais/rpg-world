import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/email.service';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';
import { SignInWithMagicLinkUseCase } from './sign-in-with-magic-link.use-case';

const CONFIRM_URL = 'https://app.test/api/auth/confirm';

/** `claimed` is false both for an unknown e-mail and inside the interval. */
function setup(claimed: boolean) {
  const repository = {
    generateMagicLink: vi.fn().mockResolvedValue('https://app.test/api/auth/confirm?token_hash=t'),
  };
  const emailService = { sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined) };
  const throttle = { claim: vi.fn().mockResolvedValue(claimed) };
  const useCase = new SignInWithMagicLinkUseCase(
    repository as unknown as AuthRepository,
    emailService as unknown as EmailService,
    throttle as AuthEmailThrottleRepo,
  );
  return { repository, emailService, throttle, useCase };
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

  it('responde igual para e-mail desconhecido ou dentro do intervalo, sem gerar link nem mandar e-mail', async () => {
    const { repository, emailService, throttle, useCase } = setup(false);

    await expect(useCase.execute('ghost@example.com', CONFIRM_URL)).resolves.toBeUndefined();

    expect(throttle.claim).toHaveBeenCalledWith('ghost@example.com', 'magiclink');
    expect(repository.generateMagicLink).not.toHaveBeenCalled();
    expect(emailService.sendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o email não for fornecido', async () => {
    const { throttle, useCase } = setup(true);

    await expect(useCase.execute('', CONFIRM_URL)).rejects.toThrow(
      'auth_error_signin_magic_link_email_required',
    );
    expect(throttle.claim).not.toHaveBeenCalled();
  });
});
