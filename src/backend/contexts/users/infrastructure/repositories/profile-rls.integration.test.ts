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
});
