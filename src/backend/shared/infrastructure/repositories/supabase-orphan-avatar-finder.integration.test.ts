import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
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

  it('poupa o fundo de ficha em uso e lista o que foi trocado', async () => {
    const { client, userId } = await createSignedInClient('orphan-background');
    const storage = new SupabaseStorageRepository(client);
    const characterId = crypto.randomUUID();
    const inUse = `${userId}/characters/${characterId}-background-v2.webp`;
    const replaced = `${userId}/characters/${characterId}-background-v1.webp`;
    const url = await storage.upload('avatars', inUse, webp());
    await storage.upload('avatars', replaced, webp());
    await client
      .from('characters')
      .insert({ id: characterId, name: 'Hero', owner_id: userId, sheet_background_url: url });

    const orphans = await new SupabaseOrphanAvatarFinder(
      SupabaseFactory.createAdmin(),
      '0 seconds',
    ).findOrphans();

    expect(orphans).not.toContain(inUse);
    expect(orphans).toContain(replaced);
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

  describe('imagem completa, que nenhuma linha do banco cita', () => {
    const list = async (userId: string, minAge = '0 seconds') =>
      (await new SupabaseOrphanAvatarFinder(SupabaseFactory.createAdmin(), minAge).findOrphans())
        .filter((path) => path.startsWith(`${userId}/`))
        .sort();

    async function setup(name: string) {
      const { client, userId } = await createSignedInClient(name);
      const storage = new SupabaseStorageRepository(client);
      const folder = `${userId}/characters`;
      return {
        client,
        userId,
        folder,
        upload: (file: string) => storage.upload('avatars', `${folder}/${file}`, webp()),
      };
    }

    it('não lista a imagem completa de um avatar em uso', async () => {
      const { client, userId, upload } = await setup('full-used');
      const avatarUrl = await upload('used-avatar.webp');
      await upload('used.webp');
      await client
        .from('characters')
        .insert({ id: crypto.randomUUID(), name: 'Hero', owner_id: userId, avatar_url: avatarUrl });

      expect(await list(userId)).toEqual([]);
    });

    it('lista os dois arquivos de um par abandonado', async () => {
      const { userId, folder, upload } = await setup('full-left');
      await upload('left.webp');
      await upload('left-avatar.webp');

      expect(await list(userId)).toEqual([`${folder}/left-avatar.webp`, `${folder}/left.webp`]);
    });

    it('lista uma imagem antiga abandonada, como a de uma conta excluída', async () => {
      const { userId, folder, upload } = await setup('old-left');
      await upload('old-style.webp');

      expect(await list(userId)).toEqual([`${folder}/old-style.webp`]);
    });

    it('lista a imagem completa cujo avatar não existe mais', async () => {
      const { userId, folder, upload } = await setup('full-alone');
      await upload('alone.webp');

      expect(await list(userId)).toEqual([`${folder}/alone.webp`]);
    });

    it('não separa um par recente quando só a imagem completa já tem a idade mínima', async () => {
      const { userId, upload } = await setup('full-straddle');
      await upload('pair.webp');
      await new Promise((resolve) => setTimeout(resolve, 2100));
      await upload('pair-avatar.webp');

      expect(await list(userId, '2 seconds')).toEqual([]);
    });
  });
});
