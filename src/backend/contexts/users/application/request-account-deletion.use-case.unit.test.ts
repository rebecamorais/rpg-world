import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../../shared/domain/EmailService';
import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { AuthRepository } from '../domain/AuthRepository';
import { UserErrorCodes } from '../domain/UserError';
import { RequestAccountDeletionUseCase } from './request-account-deletion.use-case';

const NOW = new Date('2026-11-04T12:00:00.000Z');
const CONFIRM_URL = 'https://rpg.test/pt/delete-account';
const INPUT = { userId: 'user-1', email: 'hero@example.com', username: 'Hero' };

describe('RequestAccountDeletionUseCase', () => {
  const save = vi.fn();
  const hasPassword = vi.fn();
  const verifyPassword = vi.fn();
  const sendAccountDeletionEmail = vi.fn();

  const useCase = new RequestAccountDeletionUseCase(
    {
      save,
      getUsername: async () => 'Hero',
    } as unknown as AccountDeletionRepo,
    { hasPassword, verifyPassword } as unknown as AuthRepository,
    { sendAccountDeletionEmail } as unknown as EmailService,
  );

  const sentLink = () => new URL(sendAccountDeletionEmail.mock.calls[0][1]);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ now: NOW });
    hasPassword.mockResolvedValue(true);
    verifyPassword.mockResolvedValue(true);
  });

  afterEach(() => vi.useRealTimers());

  it.each(['hero', 'Hero ', ' Hero', 'HERO'])(
    'username "%s" não bate exatamente: recusa sem enviar e-mail',
    async (username) => {
      await expect(
        useCase.execute({ ...INPUT, username, password: 'secret' }, CONFIRM_URL),
      ).rejects.toMatchObject({ code: UserErrorCodes.DELETION_USERNAME_MISMATCH });

      expect(verifyPassword).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      expect(sendAccountDeletionEmail).not.toHaveBeenCalled();
    },
  );

  it('conta com senha e senha errada: recusa sem enviar e-mail', async () => {
    verifyPassword.mockResolvedValue(false);

    await expect(
      useCase.execute({ ...INPUT, password: 'wrong' }, CONFIRM_URL),
    ).rejects.toMatchObject({ code: UserErrorCodes.DELETION_PASSWORD_INVALID });

    expect(verifyPassword).toHaveBeenCalledWith(INPUT.email, 'wrong');
    expect(save).not.toHaveBeenCalled();
    expect(sendAccountDeletionEmail).not.toHaveBeenCalled();
  });

  it.each([[undefined], ['']])(
    'conta com senha não pula a conferência mandando password=%j',
    async (password) => {
      await expect(useCase.execute({ ...INPUT, password }, CONFIRM_URL)).rejects.toMatchObject({
        code: UserErrorCodes.DELETION_PASSWORD_INVALID,
      });

      expect(save).not.toHaveBeenCalled();
      expect(sendAccountDeletionEmail).not.toHaveBeenCalled();
    },
  );

  it('conta sem senha manda o e-mail sem conferir senha', async () => {
    hasPassword.mockResolvedValue(false);

    await useCase.execute({ ...INPUT, password: 'ignored' }, CONFIRM_URL);

    expect(hasPassword).toHaveBeenCalledWith(INPUT.userId);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(sendAccountDeletionEmail).toHaveBeenCalledOnce();
  });

  it('o token tem 32 bytes aleatórios, só o sha256 vai para o repositório, com validade de 1 hora', async () => {
    await useCase.execute({ ...INPUT, password: 'secret' }, CONFIRM_URL);

    const link = sentLink();
    const token = link.searchParams.get('token')!;
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);

    const expectedHash = createHash('sha256').update(token).digest('hex');
    expect(save).toHaveBeenCalledExactlyOnceWith(
      INPUT.userId,
      expectedHash,
      new Date(NOW.getTime() + 60 * 60 * 1000),
    );
    expect(JSON.stringify(save.mock.calls)).not.toContain(token);
  });

  it('o link leva à página da confirmação, para o e-mail da conta', async () => {
    await useCase.execute({ ...INPUT, password: 'secret' }, CONFIRM_URL);

    expect(sendAccountDeletionEmail.mock.calls[0][0]).toBe(INPUT.email);
    const link = sentLink();
    expect(`${link.origin}${link.pathname}`).toBe(CONFIRM_URL);
  });

  it('cada pedido gera um token novo', async () => {
    await useCase.execute({ ...INPUT, password: 'secret' }, CONFIRM_URL);
    await useCase.execute({ ...INPUT, password: 'secret' }, CONFIRM_URL);

    expect(save.mock.calls[0][1]).not.toBe(save.mock.calls[1][1]);
  });

  it('grava o token antes de enviar: o link do e-mail nunca nasce inválido', async () => {
    await useCase.execute({ ...INPUT, password: 'secret' }, CONFIRM_URL);

    expect(save.mock.invocationCallOrder[0]).toBeLessThan(
      sendAccountDeletionEmail.mock.invocationCallOrder[0],
    );
  });
});
