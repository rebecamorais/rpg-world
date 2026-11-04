import { describe, expect, it, vi } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { EmailService } from '../../../shared/domain/EmailService';
import { SupabaseStorageRepository } from '../../../shared/infrastructure/repositories/supabase-storage-repository';
import { UserErrorCodes } from '../domain/UserError';
import { SupabaseAccountDeletionRepository } from '../infrastructure/repositories/supabase-account-deletion.repository';
import { SupabaseAuthRepository } from '../infrastructure/repositories/supabase-auth-repository';
import { DeleteAccountUseCase } from './delete-account.use-case';
import { GetAccountDeletionUseCase } from './get-account-deletion.use-case';
import { GetSessionUserUseCase } from './get-session-user.use-case';
import { RequestAccountDeletionUseCase } from './request-account-deletion.use-case';

const PASSWORD = 'RlsTestPass123!';
const CONFIRM_URL = 'https://rpg.test/en/delete-account';
const PERMISSION_DENIED = '42501';
const LINK_INVALID = { code: UserErrorCodes.DELETION_LINK_INVALID };

const admin = SupabaseFactory.createAdmin();

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

type AdminWithHold = {
  schema(name: 'test_helpers'): {
    rpc(
      fn: 'run_and_hold',
      args: { p_sql: string; p_seconds: number },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
};

function setup(authClient: Session['client'] = admin as unknown as Session['client']) {
  const links: string[] = [];
  const email = {
    sendAccountDeletionEmail: async (_to: string, link: string) => void links.push(link),
  } as unknown as EmailService;
  const deletionRepo = new SupabaseAccountDeletionRepository(admin);
  const authRepo = new SupabaseAuthRepository(authClient, admin);

  return {
    authRepo,
    deletionRepo,
    request: new RequestAccountDeletionUseCase(deletionRepo, authRepo, email),
    get: new GetAccountDeletionUseCase(deletionRepo),
    remove: new DeleteAccountUseCase(deletionRepo, authRepo),
    lastToken: () => new URL(links.at(-1)!).searchParams.get('token')!,
  };
}

async function account(session: Session) {
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(session.userId),
    admin.from('profile').select('username').eq('id', session.userId).single(),
  ]);
  return { userId: session.userId, email: user.user!.email!, username: profile!.username! };
}

async function requestToken(session: Session, flow = setup()) {
  await flow.request.execute({ ...(await account(session)), password: PASSWORD }, CONFIRM_URL);
  return flow.lastToken();
}

/** Direct SQL for states the APIs can't produce. test_helpers exists only in the test database. */
async function runSql(sql: string) {
  const { error } = await (admin as unknown as AdminWithHold)
    .schema('test_helpers')
    .rpc('run_and_hold', { p_sql: sql, p_seconds: 0 });
  if (error) throw new Error(error.message);
}

async function accountGone(userId: string) {
  const { error } = await admin.auth.admin.getUserById(userId);
  return error?.status === 404;
}

describe('Exclusão de conta (Integration)', () => {
  describe('excluir', () => {
    it('apaga conta, personagens e NPCs, e as imagens entram na fila de órfãs', async () => {
      const session = await createSignedInClient('delete');
      const { client, userId } = session;
      const storage = new SupabaseStorageRepository(client);
      const image = () => new Blob([new Uint8Array(8)], { type: 'image/png' });
      const avatar = await storage.upload('avatars', `${userId}/avatar-a.png`, image());
      const sheet = await storage.upload('avatars', `${userId}/characters/c.png`, image());
      await client.from('profile').update({ avatar_url: avatar }).eq('id', userId);
      const { data: characters, error } = await client
        .from('characters')
        .insert([
          { name: 'Hero', owner_id: userId, kind: 'pc', avatar_url: sheet },
          { name: 'Goblin', owner_id: userId, kind: 'npc', avatar_url: null },
        ])
        .select('id');
      expect(error).toBeNull();

      const flow = setup();
      await flow.remove.execute(await requestToken(session, flow));

      expect(await accountGone(userId)).toBe(true);
      const left = await admin
        .from('characters')
        .select('id')
        .in(
          'id',
          characters!.map((c) => c.id),
        );
      expect(left.data).toEqual([]);
      const profile = await admin.from('profile').select('id').eq('id', userId);
      expect(profile.data).toEqual([]);

      const { data: orphans } = await admin.rpc('orphan_avatar_objects', {
        min_age: '0 seconds',
      });
      expect(orphans).toEqual(
        expect.arrayContaining([`${userId}/avatar-a.png`, `${userId}/characters/c.png`]),
      );
    });

    it('o pedido sai junto com a conta', async () => {
      const session = await createSignedInClient('cascade');
      const flow = setup();
      await flow.remove.execute(await requestToken(session, flow));

      const { data } = await admin
        .from('account_deletion_requests')
        .select('user_id')
        .eq('user_id', session.userId);
      expect(data).toEqual([]);
    });

    it('feedbacks ficam só com o texto: com e sem vínculo, mesmo com o e-mail em maiúsculas', async () => {
      const session = await createSignedInClient('feedback');
      const other = await createSignedInClient('other-feedback');
      const { email } = await account(session);
      const { email: otherEmail } = await account(other);
      const { error } = await admin.from('feedback').insert([
        { user_id: session.userId, email, type: 'bug', message: 'com vínculo' },
        { email: email.toUpperCase(), type: 'bug', message: 'sem vínculo' },
        { user_id: other.userId, email: otherEmail, type: 'bug', message: 'de outra pessoa' },
      ]);
      expect(error).toBeNull();

      const flow = setup();
      await flow.remove.execute(await requestToken(session, flow));

      const { data } = await admin
        .from('feedback')
        .select('user_id, email, type, message')
        .order('message');
      expect(data).toEqual([
        { user_id: null, email: null, type: 'bug', message: 'com vínculo' },
        { user_id: other.userId, email: otherEmail, type: 'bug', message: 'de outra pessoa' },
        { user_id: null, email: null, type: 'bug', message: 'sem vínculo' },
      ]);
    });
  });

  describe('funções só do service_role', () => {
    it('auth_user_has_password: verdadeiro com senha, falso sem conta', async () => {
      const { userId } = await createSignedInClient('with-password');

      const has = (id: string) => admin.rpc('auth_user_has_password', { p_user_id: id });
      expect((await has(userId)).data).toBe(true);
      expect((await has(crypto.randomUUID())).data).toBe(false);
    });

    // Quem entrou só com Google. Pela API admin não dá para criar assim: sem senha, o createUser e o
    // generateLink gravam uma senha aleatória.
    it.each(['NULL', "''"])('auth_user_has_password: falso com a senha %s', async (stored) => {
      const { userId } = await createSignedInClient('google');
      await runSql(`UPDATE auth.users SET encrypted_password = ${stored} WHERE id = '${userId}'`);

      const { data } = await admin.rpc('auth_user_has_password', { p_user_id: userId });

      expect(data).toBe(false);
    });

    it('quem não tem senha pede a exclusão sem conferência e exclui pelo link', async () => {
      const session = await createSignedInClient('no-password');
      await runSql(`UPDATE auth.users SET encrypted_password = '' WHERE id = '${session.userId}'`);
      const flow = setup();

      await flow.request.execute(await account(session), CONFIRM_URL);
      await flow.remove.execute(flow.lastToken());

      expect(await accountGone(session.userId)).toBe(true);
    });

    it('auth_user_id_exists: só para conta que existe', async () => {
      const { userId } = await createSignedInClient('exists');

      const exists = (id: string) => admin.rpc('auth_user_id_exists', { p_user_id: id });
      expect((await exists(userId)).data).toBe(true);
      expect((await exists(crypto.randomUUID())).data).toBe(false);
    });

    it.each(['auth_user_has_password', 'auth_user_id_exists'] as const)(
      '%s não executa para a chave pública nem para o usuário logado',
      async (fn) => {
        const { client, userId } = await createSignedInClient('rpc');

        const logged = await client.rpc(fn, { p_user_id: userId });
        const anon = await SupabaseFactory.createAnon().rpc(fn, { p_user_id: userId });

        expect(logged.error?.code).toBe(PERMISSION_DENIED);
        expect(anon.error?.code).toBe(PERMISSION_DENIED);
      },
    );

    it('account_deletion_requests não existe para a chave pública nem para o usuário logado', async () => {
      const session = await createSignedInClient('requests');
      await requestToken(session);

      const logged = await session.client.from('account_deletion_requests').select('*');
      const anon = await SupabaseFactory.createAnon().from('account_deletion_requests').select('*');

      expect(logged.error?.code).toBe(PERMISSION_DENIED);
      expect(anon.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe('o pedido', () => {
    it('só o hash fica no banco', async () => {
      const session = await createSignedInClient('hash');
      const token = await requestToken(session);

      const { data } = await admin
        .from('account_deletion_requests')
        .select('token_hash, expires_at')
        .eq('user_id', session.userId)
        .single();

      expect(data!.token_hash).not.toContain(token);
      const minutesLeft = (new Date(data!.expires_at).getTime() - Date.now()) / 60_000;
      expect(minutesLeft).toBeGreaterThan(59);
      expect(minutesLeft).toBeLessThanOrEqual(60);
    });

    it('senha errada não gera pedido', async () => {
      const session = await createSignedInClient('wrong-password');
      const flow = setup();

      await expect(
        flow.request.execute({ ...(await account(session)), password: 'wrong' }, CONFIRM_URL),
      ).rejects.toMatchObject({ code: UserErrorCodes.DELETION_PASSWORD_INVALID });

      const { data } = await admin
        .from('account_deletion_requests')
        .select('user_id')
        .eq('user_id', session.userId);
      expect(data).toEqual([]);
    });

    it('a conferência da senha não toca a sessão atual e encerra a que abriu', async () => {
      const session = await createSignedInClient('keeps-session');
      const before = await session.client.auth.getSession();
      const isolated = SupabaseFactory.createAnon();
      const signIn = vi.spyOn(isolated.auth, 'signInWithPassword');
      const repo = new SupabaseAuthRepository(session.client, admin, () => isolated);
      const { email } = await account(session);

      await expect(repo.verifyPassword(email, PASSWORD)).resolves.toBe(true);

      const after = await session.client.auth.getSession();
      expect(after.data.session?.access_token).toBe(before.data.session?.access_token);
      expect((await admin.auth.getUser(before.data.session!.access_token)).error).toBeNull();

      const opened = (await signIn.mock.results[0].value).data.session!.access_token;
      expect(opened).not.toBe(before.data.session?.access_token);
      expect((await admin.auth.getUser(opened)).error).not.toBeNull();
    });

    it('abrir o link não apaga e mostra o username', async () => {
      const session = await createSignedInClient('open');
      const flow = setup();
      const token = await requestToken(session, flow);
      const { username } = await account(session);

      await expect(flow.get.execute(token)).resolves.toEqual({ username });
      await expect(flow.get.execute(token)).resolves.toEqual({ username });

      expect(await accountGone(session.userId)).toBe(false);
    });

    it('pedir de novo: o link anterior deixa de valer', async () => {
      const session = await createSignedInClient('again');
      const flow = setup();
      const first = await requestToken(session, flow);
      const second = await requestToken(session, flow);

      await expect(flow.get.execute(first)).resolves.toBeNull();
      await expect(flow.remove.execute(first)).rejects.toMatchObject(LINK_INVALID);
      expect(await accountGone(session.userId)).toBe(false);

      await flow.remove.execute(second);
      expect(await accountGone(session.userId)).toBe(true);
    });

    it('link vencido não abre nem apaga', async () => {
      const session = await createSignedInClient('expired');
      const flow = setup();
      const token = await requestToken(session, flow);
      await admin
        .from('account_deletion_requests')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('user_id', session.userId);

      await expect(flow.get.execute(token)).resolves.toBeNull();
      await expect(flow.remove.execute(token)).rejects.toMatchObject(LINK_INVALID);
      expect(await accountGone(session.userId)).toBe(false);
    });
  });

  describe('dois cliques e falhas', () => {
    it('depois de excluir, o mesmo link é inválido', async () => {
      const session = await createSignedInClient('used');
      const flow = setup();
      const token = await requestToken(session, flow);

      await flow.remove.execute(token);

      await expect(flow.get.execute(token)).resolves.toBeNull();
      await expect(flow.remove.execute(token)).rejects.toMatchObject(LINK_INVALID);
    });

    it('dois cliques simultâneos não viram erro inesperado', async () => {
      const session = await createSignedInClient('both');
      const flow = setup();
      const token = await requestToken(session, flow);

      const results = await Promise.allSettled([
        flow.remove.execute(token),
        flow.remove.execute(token),
      ]);

      expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
      for (const result of results) {
        if (result.status === 'rejected') expect(result.reason).toMatchObject(LINK_INVALID);
      }
      expect(await accountGone(session.userId)).toBe(true);
    });

    it('o link sobrevive a uma exclusão que falhou, para a pessoa clicar de novo', async () => {
      const session = await createSignedInClient('survives');
      const flow = setup();
      const token = await requestToken(session, flow);
      const deleteUser = vi.spyOn(admin.auth.admin, 'deleteUser').mockResolvedValue({
        data: { user: null },
        error: { status: 500, message: 'Database error deleting user' },
      } as never);

      await expect(flow.remove.execute(token)).rejects.toThrow('Database error deleting user');
      deleteUser.mockRestore();

      await expect(flow.get.execute(token)).resolves.not.toBeNull();
      await flow.remove.execute(token);
      expect(await accountGone(session.userId)).toBe(true);
    });

    it('um deadlock de verdade com outra transação é vencido tentando de novo', async () => {
      const session = await createSignedInClient('deadlock');
      const { email } = await account(session);
      const { data: feedback, error } = await admin
        .from('feedback')
        .insert({ user_id: session.userId, email, type: 'bug', message: 'trava' })
        .select('id')
        .single();
      expect(error).toBeNull();
      const flow = setup();
      const token = await requestToken(session, flow);
      const deleteUser = vi.spyOn(admin.auth.admin, 'deleteUser');

      // Pega o feedback e depois vai atrás da conta, a ordem inversa da exclusão (a conta, e pelo
      // gatilho o feedback): cada um fica esperando o que o outro já tem.
      const held = runSql(`DO $do$ BEGIN
        UPDATE public.feedback SET status = 'closed' WHERE id = '${feedback!.id}';
        PERFORM pg_sleep(0.7);
        UPDATE auth.users SET updated_at = now() WHERE id = '${session.userId}';
      END $do$`);
      await new Promise((resolve) => setTimeout(resolve, 300));

      await flow.remove.execute(token);
      await held;

      expect(deleteUser.mock.calls.length).toBeGreaterThan(1);
      deleteUser.mockRestore();
      expect(await accountGone(session.userId)).toBe(true);
    });
  });

  describe('sessão antiga', () => {
    it('um JWT ainda válido deixa de valer como sessão, e sair com ele não falha', async () => {
      const session = await createSignedInClient('stale');
      const getSession = () =>
        new GetSessionUserUseCase(new SupabaseAuthRepository(session.client, admin)).execute();
      await expect(getSession()).resolves.toMatchObject({ id: session.userId });

      const flow = setup();
      await flow.remove.execute(await requestToken(session, flow));

      const { data } = await session.client.auth.getClaims();
      expect(data?.claims.sub).toBe(session.userId);
      await expect(getSession()).resolves.toBeNull();

      await expect(
        new SupabaseAuthRepository(session.client, admin).signOut(),
      ).resolves.not.toThrow();
    });

    it('o proxy reconhece a conta excluída pelo próprio JWT: a leitura do perfil vem vazia, sem erro', async () => {
      const session = await createSignedInClient('stale-proxy');
      const flow = setup();
      await flow.remove.execute(await requestToken(session, flow));

      const { data, error } = await session.client
        .from('profile')
        .select('id')
        .eq('id', session.userId)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeNull();
    });
  });
});
