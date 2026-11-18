import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/email.service';
import { UserErrorCodes } from '../domain/UserError';
import { AccountDeletionRepo } from '../domain/account-deletion.repo';
import { AuthRepository } from '../domain/auth.repo';
import { UpdatePasswordUseCase } from './update-password.use-case';

const FORGOT = 'https://rpg.test/forgot-password';
const INPUT = {
  userId: 'user-1',
  email: 'hero@example.com',
  currentPassword: 'old-secret',
  newPassword: 'new-secret',
};

describe('UpdatePasswordUseCase', () => {
  const updatePassword = vi.fn();
  const hasPassword = vi.fn();
  const verifyPassword = vi.fn();
  const claimPasswordAttempt = vi.fn();
  const releasePasswordAttempt = vi.fn();
  const clearPasswordAttempts = vi.fn();
  const sendPasswordChangedEmail = vi.fn();

  const useCase = new UpdatePasswordUseCase(
    { updatePassword, hasPassword, verifyPassword } as unknown as AuthRepository,
    {
      claimPasswordAttempt,
      releasePasswordAttempt,
      clearPasswordAttempts,
    } as unknown as AccountDeletionRepo,
    { sendPasswordChangedEmail } as unknown as EmailService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    hasPassword.mockResolvedValue(true);
    verifyPassword.mockResolvedValue(true);
    claimPasswordAttempt.mockResolvedValue(true);
    clearPasswordAttempts.mockResolvedValue(undefined);
  });

  it('confere a senha atual, troca e avisa por e-mail', async () => {
    await useCase.execute(INPUT, FORGOT);

    expect(verifyPassword).toHaveBeenCalledWith('hero@example.com', 'old-secret');
    expect(updatePassword).toHaveBeenCalledWith('new-secret');
    expect(sendPasswordChangedEmail).toHaveBeenCalledWith('hero@example.com', FORGOT);
  });

  it('senha atual errada: não troca nem manda e-mail', async () => {
    verifyPassword.mockResolvedValue(false);

    await expect(useCase.execute(INPUT, FORGOT)).rejects.toMatchObject({
      code: UserErrorCodes.UPDATE_PASSWORD_CURRENT_INVALID,
    });
    expect(updatePassword).not.toHaveBeenCalled();
    expect(sendPasswordChangedEmail).not.toHaveBeenCalled();
  });

  it('sem a senha atual, a conta que tem senha é recusada', async () => {
    await expect(
      useCase.execute({ ...INPUT, currentPassword: undefined }, FORGOT),
    ).rejects.toMatchObject({ code: UserErrorCodes.UPDATE_PASSWORD_CURRENT_INVALID });
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('tentativas esgotadas: recusa sem perguntar ao Auth', async () => {
    claimPasswordAttempt.mockResolvedValue(false);

    await expect(useCase.execute(INPUT, FORGOT)).rejects.toMatchObject({
      code: UserErrorCodes.DELETION_TOO_MANY_ATTEMPTS,
    });
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('conta sem senha (só Google) cria a senha sem pedir a atual', async () => {
    hasPassword.mockResolvedValue(false);

    await useCase.execute({ ...INPUT, currentPassword: undefined }, FORGOT);

    expect(verifyPassword).not.toHaveBeenCalled();
    expect(updatePassword).toHaveBeenCalledWith('new-secret');
    expect(sendPasswordChangedEmail).toHaveBeenCalled();
  });

  it('o e-mail que falha não faz a troca, já feita, parecer falha', async () => {
    sendPasswordChangedEmail.mockRejectedValue(new Error('smtp down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(useCase.execute(INPUT, FORGOT)).resolves.toBeUndefined();
    expect(updatePassword).toHaveBeenCalled();
  });

  it('deve lançar erro se a nova senha não for fornecida', async () => {
    await expect(useCase.execute({ ...INPUT, newPassword: '' }, FORGOT)).rejects.toThrow(
      'auth_error_update_password_required',
    );
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
