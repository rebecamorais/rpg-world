import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { UserError, UserErrorCodes } from '../../domain/UserError';
import { SupabaseProfileRepository } from './supabase-profile-repository';

describe('profile com client do usuário (Integration)', () => {
  type Session = Awaited<ReturnType<typeof createSignedInClient>>;
  let user: Session;
  let other: Session;

  beforeEach(async () => {
    user = await createSignedInClient('profile-user');
    other = await createSignedInClient('profile-other');
  });

  it('o usuário lê e atualiza o próprio perfil (criado pelo trigger de cadastro)', async () => {
    const repo = new SupabaseProfileRepository(user.client);

    await repo.update({ id: user.userId, fullName: 'Own Name' });

    expect((await repo.getById(user.userId))?.fullName).toBe('Own Name');
  });

  it('username já usado por outra pessoa vira erro traduzível, não 500', async () => {
    await new SupabaseProfileRepository(other.client).update({
      id: other.userId,
      username: 'taken_name',
    });

    const error = await new SupabaseProfileRepository(user.client)
      .update({ id: user.userId, username: 'taken_name' })
      .catch((e) => e);

    expect(error).toBeInstanceOf(UserError);
    expect(error.code).toBe(UserErrorCodes.PROFILE_USERNAME_TAKEN);
  });

  it('o usuário não lê nem altera o perfil de outro', async () => {
    const repo = new SupabaseProfileRepository(user.client);

    expect(await repo.getById(other.userId)).toBeNull();
    await repo.update({ id: other.userId, fullName: 'Hijacked' });

    const otherProfile = await new SupabaseProfileRepository(other.client).getById(other.userId);
    expect(otherProfile?.fullName).not.toBe('Hijacked');
  });

  it('o usuário recria o próprio perfil quando ele não existe, mas não o de outro', async () => {
    const admin = SupabaseFactory.createAdmin();
    await admin.from('profile').delete().in('id', [user.userId, other.userId]);
    const repo = new SupabaseProfileRepository(user.client);

    await expect(repo.create({ id: user.userId, fullName: 'Recreated' })).resolves.toBeUndefined();
    await expect(repo.create({ id: other.userId, fullName: 'Forged' })).rejects.toThrow();

    expect((await repo.getById(user.userId))?.fullName).toBe('Recreated');
  });

  it('criar um perfil que já existe (primeiro login em duas abas) não é erro', async () => {
    const repo = new SupabaseProfileRepository(user.client);

    await expect(repo.create({ id: user.userId, fullName: 'Second tab' })).resolves.toBeUndefined();
    expect((await repo.getById(user.userId))?.fullName).not.toBe('Second tab');
  });

  it('cadastro novo ganha um username gerado, ainda não escolhido', async () => {
    const admin = SupabaseFactory.createAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: `fulano.de.tal-${crypto.randomUUID()}@example.com`,
      password: 'RlsTestPass123!',
      email_confirm: true,
    });
    if (error || !data.user) throw error;

    const { data: profile } = await admin
      .from('profile')
      .select('username, username_chosen')
      .eq('id', data.user.id)
      .single();

    expect(profile?.username).toMatch(/^[a-z]+_[a-z]+_\d{4}$/);
    expect(profile?.username).not.toContain('fulano');
    expect(profile?.username_chosen).toBe(false);
  });

  it('dois usernames que só diferem por maiúsculas não convivem', async () => {
    const name = `bia_${crypto.randomUUID().slice(0, 6)}`;
    await new SupabaseProfileRepository(other.client).update({ id: other.userId, username: name });

    const error = await new SupabaseProfileRepository(user.client)
      .update({ id: user.userId, username: name.toUpperCase() })
      .catch((e) => e);

    expect(error).toBeInstanceOf(UserError);
    expect(error.code).toBe(UserErrorCodes.PROFILE_USERNAME_TAKEN);
  });

  it('salvar o username marca como escolhido', async () => {
    const repo = new SupabaseProfileRepository(user.client);
    expect((await repo.getById(user.userId))?.usernameChosen).toBe(false);

    await repo.update({
      id: user.userId,
      username: `aventureira_${crypto.randomUUID().slice(0, 6)}`,
    });

    expect((await repo.getById(user.userId))?.usernameChosen).toBe(true);
  });

  it('salvar só o nome completo não muda a marca', async () => {
    const repo = new SupabaseProfileRepository(user.client);

    await repo.update({ id: user.userId, fullName: 'Só o nome' });

    expect((await repo.getById(user.userId))?.usernameChosen).toBe(false);
  });
});
