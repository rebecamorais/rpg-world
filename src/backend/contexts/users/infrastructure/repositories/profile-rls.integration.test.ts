import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
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
});
