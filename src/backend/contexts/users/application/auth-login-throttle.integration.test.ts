import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { UserErrorCodes } from '../domain/UserError';
import { LoginAttemptKeys } from '../domain/auth-login-throttle.repo';
import { SupabaseAuthLoginThrottleRepository } from '../infrastructure/repositories/supabase-auth-login-throttle.repository';
import { SupabaseAuthRepository } from '../infrastructure/repositories/supabase-auth-repository';
import { SignInWithPasswordUseCase } from './sign-in-with-password.use-case';

const PASSWORD = 'LoginLimitPass123!';
const PERMISSION_DENIED = '42501';
const LOCKOUT_SECONDS = 15 * 60;

const admin = SupabaseFactory.createAdmin();
const throttle = new SupabaseAuthLoginThrottleRepository(admin);

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}@example.com`;
// TEST-NET-3 (RFC 5737): never a real client
const uniqueIp = () => `203.0.113.${Math.floor(Math.random() * 254) + 1}`;

/** Takes `count` attempts in a row and returns what each claim answered. */
async function claimTimes(keys: LoginAttemptKeys, count: number) {
  const answers: number[] = [];
  for (let i = 0; i < count; i++) answers.push(await throttle.claim(keys));
  return answers;
}

async function rows(scope: 'email' | 'ip') {
  const { data, error } = await admin
    .from('auth_login_throttle')
    .select('scope, key_hash, failed_at, locked_until')
    .eq('scope', scope);
  if (error) throw error;
  return data;
}

describe('Limite de tentativas de senha no login (integração)', () => {
  it('a 5ª senha errada ainda é respondida; a 6ª espera 15 minutos', async () => {
    const keys = { email: uniqueEmail('limit'), ip: uniqueIp() };

    expect(await claimTimes(keys, 5)).toEqual([0, 0, 0, 0, 0]);

    const wait = await throttle.claim(keys);
    expect(wait).toBeGreaterThan(LOCKOUT_SECONDS - 5);
    expect(wait).toBeLessThanOrEqual(LOCKOUT_SECONDS);
  });

  it('o e-mail é normalizado: maiúsculas e espaços contam como o mesmo', async () => {
    const email = uniqueEmail('normalized');

    await claimTimes({ email }, 3);
    await claimTimes({ email: `  ${email.toUpperCase()} ` }, 2);

    expect(await throttle.claim({ email })).toBeGreaterThan(0);
  });

  it('guarda só hashes, nunca o e-mail nem o IP', async () => {
    const email = uniqueEmail('hashed');
    const ip = uniqueIp();

    await throttle.claim({ email, ip });

    const stored = JSON.stringify(await Promise.all([rows('email'), rows('ip')]));
    expect(stored).not.toContain(email);
    expect(stored).not.toContain(ip);
    expect((await rows('email'))[0].key_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('o bloqueio conta da última senha errada e, vencido, recomeça do zero', async () => {
    const keys = { email: uniqueEmail('expire') };
    await claimTimes(keys, 5);

    // As if 15 minutes had gone by since the 5th failure
    const past = new Date(Date.now() - LOCKOUT_SECONDS * 1000 - 1000).toISOString();
    const { error } = await admin
      .from('auth_login_throttle')
      .update({ locked_until: past, failed_at: Array(5).fill(past), last_failed_at: past })
      .eq('scope', 'email');
    if (error) throw error;

    expect(await claimTimes(keys, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(await throttle.claim(keys)).toBeGreaterThan(0);
  });

  it('senhas erradas de mais de 15 minutos atrás não contam', async () => {
    const keys = { email: uniqueEmail('window') };
    await claimTimes(keys, 4);
    const old = new Date(Date.now() - LOCKOUT_SECONDS * 1000 - 1000).toISOString();
    await admin
      .from('auth_login_throttle')
      .update({ failed_at: Array(4).fill(old) })
      .eq('scope', 'email');

    expect(await claimTimes(keys, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('senha certa zera o e-mail', async () => {
    const keys = { email: uniqueEmail('success') };
    await claimTimes(keys, 4);

    await throttle.succeed(keys);

    expect(await claimTimes(keys, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('tentativa devolvida (Auth fora do ar) não conta e destrava', async () => {
    const keys = { email: uniqueEmail('release') };
    await claimTimes(keys, 5);

    await throttle.release(keys);

    expect(await throttle.claim(keys)).toBe(0);
    expect(await throttle.claim(keys)).toBeGreaterThan(0);
  });

  it('IP: 20 senhas erradas em e-mails diferentes travam o IP, até para um e-mail novo', async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 20; i++) {
      expect(await throttle.claim({ email: uniqueEmail(`ip-${i}`), ip })).toBe(0);
    }

    expect(await throttle.claim({ email: uniqueEmail('ip-new'), ip })).toBeGreaterThan(0);
    // Without an IP only the e-mail counts
    expect(await throttle.claim({ email: uniqueEmail('ip-none') })).toBe(0);
    // Another IP is not affected
    expect(await throttle.claim({ email: uniqueEmail('ip-other'), ip: '198.51.100.9' })).toBe(0);
  });

  it('a senha certa não zera o IP, só devolve a tentativa dela', async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 19; i++) await throttle.claim({ email: uniqueEmail(`ip-s-${i}`), ip });
    const mine = { email: uniqueEmail('ip-mine'), ip };
    await throttle.claim(mine);
    await throttle.succeed(mine);

    // 19 still count: one more goes through and locks
    expect(await throttle.claim({ email: uniqueEmail('ip-a'), ip })).toBe(0);
    expect(await throttle.claim({ email: uniqueEmail('ip-b'), ip })).toBeGreaterThan(0);
  });

  it('e-mail travado recusa sem contar nada no IP', async () => {
    const email = uniqueEmail('locked-no-ip');
    await claimTimes({ email }, 5);
    const ip = uniqueIp();

    expect(await throttle.claim({ email, ip })).toBeGreaterThan(0);

    const [ipRow] = await rows('ip');
    expect(ipRow.failed_at).toEqual([]);
  });

  it('tentativas simultâneas: só 5 passam', async () => {
    const keys = { email: uniqueEmail('race') };

    const answers = await Promise.all(Array.from({ length: 10 }, () => throttle.claim(keys)));

    expect(answers.filter((wait) => wait === 0)).toHaveLength(5);
  });

  it('linhas vencidas somem quando outra tentativa termina', async () => {
    const stale = { email: uniqueEmail('stale') };
    await throttle.claim(stale);
    const past = new Date(Date.now() - LOCKOUT_SECONDS * 1000 - 1000).toISOString();
    await admin.from('auth_login_throttle').update({ last_failed_at: past }).eq('scope', 'email');

    const other = { email: uniqueEmail('other') };
    await throttle.claim(other);
    await throttle.release(other);

    expect(await rows('email')).toHaveLength(1);
  });

  it('pelo caso de uso: 5 senhas erradas, e a 6ª é recusada mesmo sendo a certa', async () => {
    const email = uniqueEmail('use-case');
    const { error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    // A client of its own: signing in changes the session of the client it runs on
    const authRepo = new SupabaseAuthRepository(SupabaseFactory.createAnon(), admin);
    const signIn = new SignInWithPasswordUseCase(authRepo, throttle);
    const ip = uniqueIp();

    for (let i = 0; i < 5; i++) {
      await expect(signIn.execute(email, 'wrong-password', ip)).rejects.toMatchObject({
        code: UserErrorCodes.SIGNIN_INVALID_CREDENTIALS,
      });
    }

    await expect(signIn.execute(email, PASSWORD, ip)).rejects.toMatchObject({
      code: UserErrorCodes.SIGNIN_TOO_MANY_ATTEMPTS,
      kind: 'rate_limited',
      details: { retryAfterMinutes: 15 },
    });
  });

  it('pelo caso de uso: a senha certa entra e zera o e-mail', async () => {
    const email = uniqueEmail('use-case-ok');
    const { error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    const authRepo = new SupabaseAuthRepository(SupabaseFactory.createAnon(), admin);
    const signIn = new SignInWithPasswordUseCase(authRepo, throttle);
    await claimTimes({ email }, 4);

    await expect(signIn.execute(email, PASSWORD)).resolves.toBeUndefined();

    expect(await rows('email')).toHaveLength(0);
  });

  it('a chave pública não alcança a tabela nem as funções', async () => {
    const anon = SupabaseFactory.createAnon();
    const hash = 'a'.repeat(64);

    const [claim, finish, table] = await Promise.all([
      anon.rpc('claim_login_attempt', { p_email_hash: hash }),
      anon.rpc('finish_login_attempt', { p_email_hash: hash }),
      anon.from('auth_login_throttle').select('key_hash'),
    ]);

    expect(claim.error?.code).toBe(PERMISSION_DENIED);
    expect(finish.error?.code).toBe(PERMISSION_DENIED);
    expect(table.error?.code).toBe(PERMISSION_DENIED);
  });
});
