import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

const makeEmailService = () =>
  ({
    sendConfirmationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendMagicLinkEmail: vi.fn(),
    sendAccountExistsEmail: vi.fn(),
    sendAccountDeletionEmail: vi.fn(),
    sendPasswordChangedEmail: vi.fn(),
    sendFinishSignUpEmail: vi.fn(),
  }) satisfies EmailService;

const makeThrottle = (claimed = true) =>
  ({ claim: vi.fn().mockResolvedValue(claimed) }) satisfies AuthEmailThrottleRepo;

describe('RequestPasswordResetUseCase', () => {
  it('envia o link de recuperação', async () => {
    const repo = { generateRecoveryLink: vi.fn().mockResolvedValue('http://link') };
    const email = makeEmailService();

    await new RequestPasswordResetUseCase(
      repo as unknown as AuthRepository,
      email,
      makeThrottle(),
    ).execute('a@b.co', '/reset');

    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.co', 'http://link');
  });

  it('dentro do intervalo ou sem conta: termina sem erro, sem gerar link e sem envio', async () => {
    const repo = { generateRecoveryLink: vi.fn() };
    const email = makeEmailService();
    const throttle = makeThrottle(false);

    await expect(
      new RequestPasswordResetUseCase(repo as unknown as AuthRepository, email, throttle).execute(
        'a@b.co',
        '/reset',
      ),
    ).resolves.toBeUndefined();
    expect(throttle.claim).toHaveBeenCalledWith('a@b.co', 'recovery');
    expect(repo.generateRecoveryLink).not.toHaveBeenCalled();
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('não revela se o e-mail existe: conta apagada depois da reserva termina sem erro e sem envio', async () => {
    const repo = {
      generateRecoveryLink: vi
        .fn()
        .mockRejectedValue(new UserError(UserErrorCodes.AUTH_USER_NOT_FOUND)),
    };
    const email = makeEmailService();

    await expect(
      new RequestPasswordResetUseCase(
        repo as unknown as AuthRepository,
        email,
        makeThrottle(),
      ).execute('nobody@b.co', '/reset'),
    ).resolves.toBeUndefined();
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['outro erro de domínio', new UserError(UserErrorCodes.AUTH_RATE_LIMITED)],
    ['falha de infraestrutura', new Error('Supabase is down')],
  ])('repassa %s em vez de fingir que deu certo', async (_label, failure) => {
    const repo = { generateRecoveryLink: vi.fn().mockRejectedValue(failure) };
    const email = makeEmailService();

    await expect(
      new RequestPasswordResetUseCase(
        repo as unknown as AuthRepository,
        email,
        makeThrottle(),
      ).execute('a@b.co', '/reset'),
    ).rejects.toBe(failure);
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('exige o e-mail', async () => {
    const repo = { generateRecoveryLink: vi.fn() };

    await expect(
      new RequestPasswordResetUseCase(
        repo as unknown as AuthRepository,
        makeEmailService(),
        makeThrottle(),
      ).execute('', '/reset'),
    ).rejects.toThrow();
    expect(repo.generateRecoveryLink).not.toHaveBeenCalled();
  });
});
