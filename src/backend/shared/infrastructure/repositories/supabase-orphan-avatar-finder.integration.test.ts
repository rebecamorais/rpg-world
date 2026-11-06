import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { CleanupOrphanAvatarsUseCase } from '../../application/cleanup-orphan-avatars.use-case';
import { SupabaseOrphanAvatarFinder } from './supabase-orphan-avatar-finder';
import { SupabaseStorageRepository } from './supabase-storage-repository';

const image = () => new Blob([new Uint8Array(8)], { type: 'image/png' });
const webp = () => new Blob([new Uint8Array(8)], { type: 'image/webp' });

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

  it('a limpeza guarda a imagem completa de um avatar em uso e apaga o par abandonado', async () => {
    const { client, userId } = await createSignedInClient('full-image');
    const storage = new SupabaseStorageRepository(client);
    const folder = `${userId}/characters`;
    const avatarUrl = await storage.upload('avatars', `${folder}/used-avatar.webp`, webp());
    await storage.upload('avatars', `${folder}/used.webp`, webp());
    await storage.upload('avatars', `${folder}/left.webp`, webp());
    await storage.upload('avatars', `${folder}/left-avatar.webp`, webp());
    await client
      .from('characters')
      .insert({ id: crypto.randomUUID(), name: 'Hero', owner_id: userId, avatar_url: avatarUrl });

    const admin = SupabaseFactory.createAdmin();
    const finder = new SupabaseOrphanAvatarFinder(admin, '0 seconds');
    // Only this user's files: other test files may be uploading at the same time
    await new CleanupOrphanAvatarsUseCase(
      {
        findOrphans: async () =>
          (await finder.findOrphans()).filter((path) => path.startsWith(`${userId}/`)),
      },
      new SupabaseStorageRepository(admin),
    ).execute();

    const { data } = await admin.storage.from('avatars').list(folder);
    expect(data?.map((file) => file.name).sort()).toEqual(['used-avatar.webp', 'used.webp']);
  });
});
