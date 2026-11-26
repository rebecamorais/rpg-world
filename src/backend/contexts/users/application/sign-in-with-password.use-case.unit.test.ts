import { describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthLoginThrottleRepo } from '../domain/auth-login-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';
import { SignInWithPasswordUseCase } from './sign-in-with-password.use-case';

function setup({ wait = 0 }: { wait?: number } = {}) {
  const authRepository = {
    signInWithPassword: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthRepository & { signInWithPassword: ReturnType<typeof vi.fn> };
  const throttle = {
    claim: vi.fn().mockResolvedValue(wait),
    release: vi.fn().mockResolvedValue(undefined),
    succeed: vi.fn().mockResolvedValue(undefined),
  } satisfies AuthLoginThrottleRepo;
  const useCase = new SignInWithPasswordUseCase(authRepository, throttle);
  return { authRepository, throttle, useCase };
}

const KEYS = { email: 'test@example.com', ip: '203.0.113.7' };

describe('SignInWithPasswordUseCase', () => {
  it('reserva a tentativa e chama o repositório com as credenciais corretas', async () => {
    const { authRepository, throttle, useCase } = setup();

    await useCase.execute('test@example.com', 'password123', '203.0.113.7');

    expect(throttle.claim).toHaveBeenCalledWith(KEYS);
    expect(authRepository.signInWithPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
    );
  });

  it('senha certa zera o e-mail (succeed)', async () => {
    const { throttle, useCase } = setup();

    await useCase.execute('test@example.com', 'password123', '203.0.113.7');

    expect(throttle.succeed).toHaveBeenCalledWith(KEYS);
    expect(throttle.release).not.toHaveBeenCalled();
  });

  it('sem IP, conta só o e-mail', async () => {
    const { throttle, useCase } = setup();

    await useCase.execute('test@example.com', 'password123');

    expect(throttle.claim).toHaveBeenCalledWith({ email: 'test@example.com', ip: undefined });
  });

  it('senha errada fica contada: não devolve a tentativa', async () => {
    const { authRepository, throttle, useCase } = setup();
    authRepository.signInWithPassword.mockRejectedValue(
      new UserError(UserErrorCodes.SIGNIN_INVALID_CREDENTIALS),
    );

    await expect(useCase.execute('test@example.com', 'wrong', '203.0.113.7')).rejects.toThrow(
      UserErrorCodes.SIGNIN_INVALID_CREDENTIALS,
    );
    expect(throttle.release).not.toHaveBeenCalled();
    expect(throttle.succeed).not.toHaveBeenCalled();
  });

  it.each([
    ['limite do Auth', new UserError(UserErrorCodes.AUTH_RATE_LIMITED)],
    ['Auth fora do ar', new Error('Auth unreachable')],
  ])('%s: devolve a tentativa e repassa o erro', async (_label, failure) => {
    const { authRepository, throttle, useCase } = setup();
    authRepository.signInWithPassword.mockRejectedValue(failure);

    await expect(useCase.execute('test@example.com', 'x', '203.0.113.7')).rejects.toBe(failure);
    expect(throttle.release).toHaveBeenCalledWith(KEYS);
  });

  it('travado: recusa sem perguntar ao Auth, com os minutos que faltam arredondados para cima', async () => {
    const { authRepository, useCase } = setup({ wait: 14 * 60 + 1 });

    const error = await useCase.execute('test@example.com', 'x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UserError);
    expect(error).toMatchObject({
      code: UserErrorCodes.SIGNIN_TOO_MANY_ATTEMPTS,
      kind: 'rate_limited',
      details: { retryAfterMinutes: 15 },
    });
    expect(authRepository.signInWithPassword).not.toHaveBeenCalled();
  });

  it('o sucesso vale mesmo se zerar o contador falhar (a sessão já foi criada)', async () => {
    const { throttle, useCase } = setup();
    throttle.succeed.mockRejectedValue(new Error('db down'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(useCase.execute('test@example.com', 'password123')).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('deve lançar erro se o email ou senha não forem fornecidos', async () => {
    const { authRepository, throttle, useCase } = setup();

    await expect(useCase.execute('', 'password123')).rejects.toThrow(
      'auth_error_signin_required_fields',
    );
    await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
      'auth_error_signin_required_fields',
    );
    expect(authRepository.signInWithPassword).not.toHaveBeenCalled();
    expect(throttle.claim).not.toHaveBeenCalled();
  });
});
