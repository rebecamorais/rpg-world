import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { UserError, UserErrorCodes } from '../../domain/UserError';
import { SupabaseAuthRepository } from './supabase-auth-repository';

const admin = SupabaseFactory.createAdmin();
const PASSWORD = 'AuthRepoPass123!';
const REDIRECT = 'http://localhost:3000/api/auth/confirm';

/** The `token_hash` and `type` our confirm route receives from an e-mailed link. */
function tokenOf(link: string) {
  const url = new URL(link);
  return {
    target: `${url.origin}${url.pathname}`,
    tokenHash: url.searchParams.get('token_hash'),
    type: url.searchParams.get('type'),
  };
}

function memoryCookieStore() {
  const jar = new Map<string, string>();
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    set: (name: string, value: string) => jar.set(name, value),
  } as unknown as ReadonlyRequestCookies;
}

/** Repository for one "browser": its own cookie jar, so sessions don't leak between tests. */
function newRepository() {
  return new SupabaseAuthRepository(SupabaseFactory.createClient(memoryCookieStore()), admin);
}

async function createUser(label: string) {
  const email = `${label}-${crypto.randomUUID()}@auth.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');
  return { email, id: data.user.id };
}

async function errorOf(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error('expected the call to fail');
    },
    (error: unknown) => error,
  );
}

describe('SupabaseAuthRepository (integração)', () => {
  describe('sessão', () => {
    it('não tem usuário antes do login', async () => {
      await expect(newRepository().getSessionUser()).resolves.toBeNull();
    });

    it('expõe o usuário depois do login e o esquece depois do logout', async () => {
      const { email, id } = await createUser('session');
      const repo = newRepository();

      await repo.signInWithPassword(email, PASSWORD);
      await expect(repo.getSessionUser()).resolves.toMatchObject({ id, email });

      await repo.signOut();
      await expect(repo.getSessionUser()).resolves.toBeNull();
    });

    it('traduz senha errada para credenciais inválidas', async () => {
      const { email } = await createUser('wrong-password');

      const error = await errorOf(newRepository().signInWithPassword(email, 'not-the-password'));

      expect(error).toBeInstanceOf(UserError);
      expect((error as UserError).code).toBe(UserErrorCodes.SIGNIN_INVALID_CREDENTIALS);
    });

    it('não aceita um código de callback inválido', async () => {
      await expect(newRepository().exchangeCodeForSession('invalid-code')).rejects.toThrow();
    });
  });

  describe('troca de senha', () => {
    async function signedIn() {
      const { email } = await createUser('password');
      const repo = newRepository();
      await repo.signInWithPassword(email, PASSWORD);
      return { repo, email };
    }

    it('troca a senha do usuário logado', async () => {
      const { repo, email } = await signedIn();

      await repo.updatePassword('BrandNewPass456!');

      await expect(newRepository().signInWithPassword(email, 'BrandNewPass456!')).resolves.toBe(
        undefined,
      );
    });

    it('recusa a mesma senha', async () => {
      const { repo } = await signedIn();

      const error = await errorOf(repo.updatePassword(PASSWORD));

      expect((error as UserError).code).toBe(UserErrorCodes.UPDATE_PASSWORD_SAME);
    });

    it('recusa senha fraca', async () => {
      const { repo } = await signedIn();

      const error = await errorOf(repo.updatePassword('123'));

      expect((error as UserError).code).toBe(UserErrorCodes.UPDATE_PASSWORD_WEAK);
    });
  });

  describe('existsByEmail', () => {
    it('encontra o e-mail sem diferenciar maiúsculas', async () => {
      const { email } = await createUser('exists');

      await expect(newRepository().existsByEmail(email.toUpperCase())).resolves.toBe(true);
    });

    it('não encontra e-mails não cadastrados', async () => {
      await expect(newRepository().existsByEmail('nobody@auth.test')).resolves.toBe(false);
    });
  });

  describe('links por e-mail', () => {
    it('gera o link de confirmação para a nossa rota, com o token e sem sessão na URL', async () => {
      const email = `signup-${crypto.randomUUID()}@auth.test`;

      const link = await newRepository().generateSignUpLink(email, PASSWORD, REDIRECT);

      const { target, tokenHash, type } = tokenOf(link);
      expect(target).toBe(REDIRECT);
      expect(type).toBe('signup');
      expect(tokenHash).toBeTruthy();
      expect(link).not.toContain('access_token');
      await expect(newRepository().existsByEmail(email)).resolves.toBe(true);
    });

    it('confirma o cadastro pelo token do link e inicia a sessão', async () => {
      const email = `signup-verify-${crypto.randomUUID()}@auth.test`;
      const { tokenHash } = tokenOf(
        await newRepository().generateSignUpLink(email, PASSWORD, REDIRECT),
      );
      const repo = newRepository();

      await repo.verifyEmailLink(tokenHash!, 'signup');

      await expect(repo.getSessionUser()).resolves.toMatchObject({ email });
    });

    it('recusa o mesmo link uma segunda vez', async () => {
      const email = `signup-reuse-${crypto.randomUUID()}@auth.test`;
      const { tokenHash } = tokenOf(
        await newRepository().generateSignUpLink(email, PASSWORD, REDIRECT),
      );
      await newRepository().verifyEmailLink(tokenHash!, 'signup');

      const error = await errorOf(newRepository().verifyEmailLink(tokenHash!, 'signup'));

      expect((error as UserError).code).toBe(UserErrorCodes.AUTH_LINK_EXPIRED);
    });

    it('recusa cadastro com e-mail já usado', async () => {
      const { email } = await createUser('duplicate');

      const error = await errorOf(newRepository().generateSignUpLink(email, PASSWORD, REDIRECT));

      expect((error as UserError).code).toBe(UserErrorCodes.SIGNUP_DUPLICATE_EMAIL);
    });

    it('gera o link de recuperação de senha', async () => {
      const { email } = await createUser('recovery');

      const link = await newRepository().generateRecoveryLink(email, REDIRECT);

      const { target, tokenHash, type } = tokenOf(link);
      expect(target).toBe(REDIRECT);
      expect(type).toBe('recovery');

      const repo = newRepository();
      await repo.verifyEmailLink(tokenHash!, 'recovery');
      await expect(repo.getSessionUser()).resolves.toMatchObject({ email });
    });

    it('gera o link mágico para a nossa rota e o token inicia a sessão', async () => {
      const { email } = await createUser('magic');

      const { target, tokenHash, type } = tokenOf(
        await newRepository().generateMagicLink(email, REDIRECT),
      );
      expect(target).toBe(REDIRECT);
      expect(type).toBe('magiclink');

      const repo = newRepository();
      await repo.verifyEmailLink(tokenHash!, 'magiclink');
      await expect(repo.getSessionUser()).resolves.toMatchObject({ email });
    });

    it('traduz recuperação de e-mail desconhecido para usuário não encontrado', async () => {
      const error = await errorOf(
        newRepository().generateRecoveryLink(`ghost-${crypto.randomUUID()}@auth.test`, REDIRECT),
      );

      expect((error as UserError).code).toBe(UserErrorCodes.AUTH_USER_NOT_FOUND);
      expect((error as UserError).kind).toBe('not_found');
    });
  });
});
