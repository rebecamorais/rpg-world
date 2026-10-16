import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

const makeEmailService = () =>
  ({ sendConfirmationEmail: vi.fn(), sendPasswordResetEmail: vi.fn() }) satisfies EmailService;

describe('RequestPasswordResetUseCase', () => {
  it('envia o link de recuperação', async () => {
    const repo = { generateRecoveryLink: vi.fn().mockResolvedValue('http://link') };
    const email = makeEmailService();

    await new RequestPasswordResetUseCase(repo as unknown as AuthRepository, email).execute(
      'a@b.co',
      '/reset',
    );

    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.co', 'http://link');
  });

  it('devolve o link quando o serviço de e-mail não envia nada (preview)', async () => {
    const repo = { generateRecoveryLink: vi.fn().mockResolvedValue('http://link') };
    const email = makeEmailService();
    email.sendPasswordResetEmail.mockResolvedValue({ previewLink: 'http://link' });

    await expect(
      new RequestPasswordResetUseCase(repo as unknown as AuthRepository, email).execute(
        'a@b.co',
        '/reset',
      ),
    ).resolves.toEqual({ previewLink: 'http://link' });
  });

  it('não revela se o e-mail existe: e-mail desconhecido termina sem erro e sem envio', async () => {
    const repo = {
      generateRecoveryLink: vi
        .fn()
        .mockRejectedValue(new UserError(UserErrorCodes.AUTH_USER_NOT_FOUND)),
    };
    const email = makeEmailService();

    await expect(
      new RequestPasswordResetUseCase(repo as unknown as AuthRepository, email).execute(
        'nobody@b.co',
        '/reset',
      ),
    ).resolves.toEqual({});
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['outro erro de domínio', new UserError(UserErrorCodes.AUTH_RATE_LIMITED)],
    ['falha de infraestrutura', new Error('Supabase is down')],
  ])('repassa %s em vez de fingir que deu certo', async (_label, failure) => {
    const repo = { generateRecoveryLink: vi.fn().mockRejectedValue(failure) };
    const email = makeEmailService();

    await expect(
      new RequestPasswordResetUseCase(repo as unknown as AuthRepository, email).execute(
        'a@b.co',
        '/reset',
      ),
    ).rejects.toBe(failure);
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('exige o e-mail', async () => {
    const repo = { generateRecoveryLink: vi.fn() };

    await expect(
      new RequestPasswordResetUseCase(
        repo as unknown as AuthRepository,
        makeEmailService(),
      ).execute('', '/reset'),
    ).rejects.toThrow();
    expect(repo.generateRecoveryLink).not.toHaveBeenCalled();
  });
});
