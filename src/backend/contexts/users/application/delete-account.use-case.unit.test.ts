import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { AuthRepository, DeleteUserDatabaseError } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { DeleteAccountUseCase } from './delete-account.use-case';

const LINK_INVALID = { code: UserErrorCodes.DELETION_LINK_INVALID };

describe('DeleteAccountUseCase', () => {
  const findValidUserId = vi.fn();
  const deleteUser = vi.fn();

  const useCase = new DeleteAccountUseCase(
    { findValidUserId } as unknown as AccountDeletionRepo,
    { deleteUser } as unknown as AuthRepository,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    findValidUserId.mockResolvedValue('user-1');
  });

  it('exclui a conta dona do token, procurado pelo hash', async () => {
    await useCase.execute('the-token');

    expect(findValidUserId).toHaveBeenCalledWith(
      createHash('sha256').update('the-token').digest('hex'),
    );
    expect(deleteUser).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('token inválido: DELETION_LINK_INVALID, sem chamar deleteUser', async () => {
    findValidUserId.mockResolvedValue(null);

    await expect(useCase.execute('bad')).rejects.toMatchObject(LINK_INVALID);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('dois cliques seguidos: só o primeiro apaga, porque o token some com a conta', async () => {
    findValidUserId.mockResolvedValueOnce('user-1').mockResolvedValueOnce(null);

    await useCase.execute('the-token');
    await expect(useCase.execute('the-token')).rejects.toMatchObject(LINK_INVALID);

    expect(deleteUser).toHaveBeenCalledOnce();
  });

  it('dois cliques simultâneos: quem chega depois da conta apagada recebe link inválido, não 500', async () => {
    deleteUser.mockRejectedValue(new UserError(UserErrorCodes.AUTH_USER_NOT_FOUND));

    await expect(useCase.execute('the-token')).rejects.toMatchObject(LINK_INVALID);
  });

  it('tenta de novo até 3 vezes quando o banco falha (deadlock)', async () => {
    deleteUser
      .mockRejectedValueOnce(new DeleteUserDatabaseError('deadlock'))
      .mockRejectedValueOnce(new DeleteUserDatabaseError('deadlock'))
      .mockRejectedValueOnce(new DeleteUserDatabaseError('deadlock'))
      .mockResolvedValueOnce(undefined);

    await expect(useCase.execute('the-token')).resolves.toBeUndefined();
    expect(deleteUser).toHaveBeenCalledTimes(4);
  });

  it('desiste depois de 3 novas tentativas, sem disfarçar a falha de link inválido', async () => {
    const failure = new DeleteUserDatabaseError('deadlock');
    deleteUser.mockRejectedValue(failure);

    await expect(useCase.execute('the-token')).rejects.toBe(failure);
    expect(deleteUser).toHaveBeenCalledTimes(4);
  });

  it('não tenta de novo em outras falhas', async () => {
    const failure = new Error('Failed to delete user: forbidden');
    deleteUser.mockRejectedValue(failure);

    await expect(useCase.execute('the-token')).rejects.toBe(failure);
    expect(deleteUser).toHaveBeenCalledOnce();
  });

  it('uma tentativa que acha a conta já apagada conta como link inválido', async () => {
    deleteUser
      .mockRejectedValueOnce(new DeleteUserDatabaseError('deadlock'))
      .mockRejectedValueOnce(new UserError(UserErrorCodes.AUTH_USER_NOT_FOUND));

    await expect(useCase.execute('the-token')).rejects.toMatchObject(LINK_INVALID);
  });
});
