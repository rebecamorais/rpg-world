import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';
import { SignUpUseCase } from './sign-up.use-case';

const REDIRECT = 'https://app.test/auth/confirm';

function setup({
  exists = false,
  confirmed = true,
  claimed = true,
  signUpLink = vi.fn().mockResolvedValue('http://mock-link'),
}: {
  exists?: boolean;
  confirmed?: boolean;
  claimed?: boolean;
  signUpLink?: ReturnType<typeof vi.fn>;
} = {}) {
  const repository = {
    existsByEmail: vi.fn().mockResolvedValue(exists),
    isEmailConfirmed: vi.fn().mockResolvedValue(confirmed),
    generateSignUpLink: signUpLink,
    generateFinishSignUpLink: vi.fn().mockResolvedValue('http://recovery-link'),
  };
  const emailService = {
    sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendAccountExistsEmail: vi.fn().mockResolvedValue(undefined),
    sendFinishSignUpEmail: vi.fn().mockResolvedValue(undefined),
  };
  const throttle = { claim: vi.fn().mockResolvedValue(claimed) };
  const useCase = new SignUpUseCase(
    repository as unknown as AuthRepository,
    emailService as unknown as EmailService,
    throttle as AuthEmailThrottleRepo,
  );
  return { repository, emailService, throttle, useCase };
}

describe('SignUpUseCase', () => {
  it('cria a conta, manda a confirmação e começa o intervalo do cadastro', async () => {
    const { repository, emailService, throttle, useCase } = setup();

    await useCase.execute('test@example.com', 'Password123!', REDIRECT);

    expect(repository.existsByEmail).toHaveBeenCalledWith('test@example.com');
    expect(repository.generateSignUpLink).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
      REDIRECT,
    );
    expect(throttle.claim).toHaveBeenCalledWith('test@example.com', 'signup');
    expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'http://mock-link',
    );
  });

  it('should throw error if email or password are not provided', async () => {
    const { repository, useCase } = setup();

    await expect(useCase.execute('', 'Password123!', REDIRECT)).rejects.toThrow(
      UserErrorCodes.SIGNUP_REQUIRED_FIELDS,
    );
    await expect(useCase.execute('test@example.com', '', REDIRECT)).rejects.toThrow(
      UserErrorCodes.SIGNUP_REQUIRED_FIELDS,
    );
    expect(repository.generateSignUpLink).not.toHaveBeenCalled();
  });

  it('responde como sucesso para e-mail já cadastrado e avisa o dono, sem mexer na conta', async () => {
    const { repository, emailService, useCase } = setup({ exists: true });

    await expect(
      useCase.execute('existing@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();
    expect(repository.generateSignUpLink).not.toHaveBeenCalled();
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(emailService.sendAccountExistsEmail).toHaveBeenCalledWith(
      'existing@example.com',
      'https://app.test/forgot-password',
    );
  });

  // Someone may have started it with their own password: confirming must not keep that password
  it('conta que existe e não confirmou recebe o link para confirmar e escolher a senha', async () => {
    const { repository, emailService, useCase } = setup({ exists: true, confirmed: false });

    await expect(
      useCase.execute('pending@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();

    expect(repository.generateFinishSignUpLink).toHaveBeenCalledWith(
      'pending@example.com',
      REDIRECT,
    );
    expect(repository.generateSignUpLink).not.toHaveBeenCalled();
    expect(emailService.sendFinishSignUpEmail).toHaveBeenCalledWith(
      'pending@example.com',
      'http://recovery-link',
    );
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(emailService.sendAccountExistsEmail).not.toHaveBeenCalled();
  });

  it('conta confirmada entre a checagem e a troca da senha recebe o aviso, e nada muda nela', async () => {
    const { repository, emailService, useCase } = setup({ exists: true, confirmed: false });
    repository.generateFinishSignUpLink.mockRejectedValue(
      new UserError(UserErrorCodes.SIGNUP_DUPLICATE_EMAIL),
    );

    await expect(
      useCase.execute('pending@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();

    expect(emailService.sendFinishSignUpEmail).not.toHaveBeenCalled();
    expect(emailService.sendAccountExistsEmail).toHaveBeenCalled();
  });

  it('conta nova: sem a reserva do intervalo (outro pedido igual levou), não manda a confirmação', async () => {
    const { emailService, useCase } = setup({ claimed: false });

    await expect(
      useCase.execute('new@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();

    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['confirmada', true],
    ['não confirmada', false],
  ])(
    'dentro do intervalo, conta %s não recebe nada e a resposta é a mesma',
    async (_label, confirmed) => {
      const { repository, emailService, throttle, useCase } = setup({
        exists: true,
        confirmed,
        claimed: false,
      });

      await expect(
        useCase.execute('existing@example.com', 'Password123!', REDIRECT),
      ).resolves.toBeUndefined();

      expect(throttle.claim).toHaveBeenCalledWith('existing@example.com', 'signup');
      expect(repository.generateSignUpLink).not.toHaveBeenCalled();
      expect(emailService.sendAccountExistsEmail).not.toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    },
  );

  it('dá a mesma resposta quando o e-mail é cadastrado entre a checagem e a criação', async () => {
    const { emailService, throttle, useCase } = setup({
      signUpLink: vi.fn().mockRejectedValue(new UserError(UserErrorCodes.SIGNUP_DUPLICATE_EMAIL)),
    });

    await expect(
      useCase.execute('racer@example.com', 'Password123!', REDIRECT),
    ).resolves.toBeUndefined();
    expect(emailService.sendAccountExistsEmail).toHaveBeenCalled();
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    // One claim: the account isn't new after all, so only the existing-account path claims
    expect(throttle.claim).toHaveBeenCalledOnce();
  });

  it.each([new UserError(UserErrorCodes.UPDATE_PASSWORD_WEAK), new Error('connect ECONNREFUSED')])(
    'repassa outros erros ao gerar o link (%s)',
    async (failure) => {
      const { emailService, useCase } = setup({
        signUpLink: vi.fn().mockRejectedValue(failure),
      });

      await expect(useCase.execute('new@example.com', 'Password123!', REDIRECT)).rejects.toBe(
        failure,
      );
      expect(emailService.sendAccountExistsEmail).not.toHaveBeenCalled();
    },
  );
});
