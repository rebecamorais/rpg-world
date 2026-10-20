import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { SupabaseOrphanAvatarFinder } from './supabase-orphan-avatar-finder';
import { SupabaseStorageRepository } from './supabase-storage-repository';

const image = () => new Blob([new Uint8Array(8)], { type: 'image/png' });

describe('orphan_avatar_objects (Integration)', () => {
  it('lista só os avatares que nenhum perfil ou personagem usa', async () => {
    const { client, userId } = await createSignedInClient('orphans');
    const storage = new SupabaseStorageRepository(client);
    const profileUrl = await storage.upload('avatars', `${userId}/avatar-saved.png`, image());
    const characterUrl = await storage.upload(
      'avatars',
      `${userId}/characters/char-saved.png`,
      image(),
    );
    await storage.upload('avatars', `${userId}/avatar-never-saved.png`, image());

    const characterId = crypto.randomUUID();
    await client.from('profile').update({ avatar_url: profileUrl }).eq('id', userId);
    await client
      .from('characters')
      .insert({ id: characterId, name: 'Hero', owner_id: userId, avatar_url: characterUrl });

    // No grace period, so the files just uploaded count
    const orphans = await new SupabaseOrphanAvatarFinder(
      SupabaseFactory.createAdmin(),
      '0 seconds',
    ).findOrphans();

    expect(orphans).toContain(`${userId}/avatar-never-saved.png`);
    expect(orphans).not.toContain(`${userId}/avatar-saved.png`);
    expect(orphans).not.toContain(`${userId}/characters/char-saved.png`);
  });

  it('deixa de fora os envios recentes, que ainda podem estar esperando o formulário', async () => {
    const { client, userId } = await createSignedInClient('recent');
    await new SupabaseStorageRepository(client).upload(
      'avatars',
      `${userId}/avatar-just-sent.png`,
      image(),
    );

    const orphans = await new SupabaseOrphanAvatarFinder(
      SupabaseFactory.createAdmin(),
    ).findOrphans();

    expect(orphans).not.toContain(`${userId}/avatar-just-sent.png`);
  });

  it('não pode ser chamada pela chave pública nem por um usuário logado', async () => {
    const { client } = await createSignedInClient('caller');

    const anon = await SupabaseFactory.createAnon().rpc('orphan_avatar_objects', {});
    const user = await client.rpc('orphan_avatar_objects', {});

    expect(anon.error).not.toBeNull();
    expect(user.error).not.toBeNull();
  });
});
