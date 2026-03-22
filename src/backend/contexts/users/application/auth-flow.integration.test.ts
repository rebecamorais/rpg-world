import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { SupabaseAuthRepository } from '../infrastructure/repositories/supabase-auth-repository';
import { SignInWithPasswordUseCase } from './sign-in-with-password.use-case';
import { UpdatePasswordUseCase } from './update-password.use-case';

const cookieJar = new Map();

const mockCookieStore = {
  get: (name: string) => {
    const value = cookieJar.get(name);
    return value ? { name, value } : undefined;
  },
  getAll: () => Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value })),
  set: (name: string, value: string) => cookieJar.set(name, value),
  remove: (name: string) => cookieJar.delete(name),
} as unknown as ReadonlyRequestCookies;

describe('Auth Flow (Integration)', () => {
  const dbClient = SupabaseFactory.createAdmin();
  const authClient = SupabaseFactory.createClient(mockCookieStore);
  const repo = new SupabaseAuthRepository(authClient, dbClient);
  const signInUseCase = new SignInWithPasswordUseCase(repo);
  const updatePasswordUseCase = new UpdatePasswordUseCase(repo);

  // Limpa o estado entre os testes
  beforeEach(() => {
    cookieJar.clear();
  });

  it('deve identificar se a senha precisa ser alterada', async () => {
    // E-mail único para evitar conflito com execuções anteriores
    const uniqueEmail = `test-change-pass-${Math.random().toString(36).substring(7)}@example.com`;
    const defaultPassword = '123MudaASenha@';

    const { error } = await dbClient.auth.admin.createUser({
      email: uniqueEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { needs_password_change: true },
    });

    if (error) throw error;

    const result = await signInUseCase.execute(uniqueEmail, defaultPassword);
    expect(result.passwordChangeRequired).toBe(true);
  });

  it('deve permitir atualizar a senha', async () => {
    const uniqueEmail = `update-${Math.random().toString(36).substring(7)}@example.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    const { error: createError } = await dbClient.auth.admin.createUser({
      email: uniqueEmail,
      password: oldPassword,
      email_confirm: true,
    });

    if (createError) throw createError;

    await new Promise((r) => setTimeout(r, 200));

    // Sign in para popular o cookieJar com a sessão
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: uniqueEmail,
      password: oldPassword,
    });

    if (signInError) throw signInError;

    await updatePasswordUseCase.execute(newPassword);

    const result = await signInUseCase.execute(uniqueEmail, newPassword);
    expect(result).toBeDefined();
    expect(result.passwordChangeRequired).toBe(false);
  });
});
