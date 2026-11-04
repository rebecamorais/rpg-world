import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { GetAccountDeletionUseCase } from './get-account-deletion.use-case';

describe('GetAccountDeletionUseCase', () => {
  const findValidUserId = vi.fn();
  const getUsername = vi.fn();
  const save = vi.fn();

  const useCase = new GetAccountDeletionUseCase({
    findValidUserId,
    getUsername,
    save,
  } as unknown as AccountDeletionRepo);

  beforeEach(() => vi.resetAllMocks());

  it('procura pelo hash do token e devolve o username da conta', async () => {
    findValidUserId.mockResolvedValue('user-1');
    getUsername.mockResolvedValue('Hero');

    await expect(useCase.execute('the-token')).resolves.toEqual({ username: 'Hero' });

    expect(findValidUserId).toHaveBeenCalledWith(
      createHash('sha256').update('the-token').digest('hex'),
    );
    expect(getUsername).toHaveBeenCalledWith('user-1');
  });

  it('devolve null para token vencido, usado ou substituído', async () => {
    findValidUserId.mockResolvedValue(null);

    await expect(useCase.execute('old-token')).resolves.toBeNull();
    expect(getUsername).not.toHaveBeenCalled();
  });

  it('só lê: abrir o link não muda nada, porque antivírus abre links sozinho', async () => {
    findValidUserId.mockResolvedValue('user-1');
    getUsername.mockResolvedValue(null);

    await expect(useCase.execute('the-token')).resolves.toEqual({ username: null });

    expect(save).not.toHaveBeenCalled();
  });
});
