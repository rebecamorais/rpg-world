import { beforeEach, describe, expect, it } from 'vitest';

import { Lore } from '@backend/contexts/lore';
import { SupabaseLoreRepository } from '@backend/contexts/lore/infrastructure/repositories/supabase-lore.repository';
import { SupabaseStorageRepository } from '@backend/shared/infrastructure/repositories/supabase-storage-repository';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { SupabaseCharacterSpellRepository } from './supabase-character-spell.repository';
import { SupabaseCharacterRepository } from './supabase-character.repository';

// Defense in depth: even calling repositories directly (skipping the use-case ownership check),
// a user-scoped client must not reach another user's data.
describe('RLS com client do usuário (Integration)', () => {
  type Session = Awaited<ReturnType<typeof createSignedInClient>>;
  let owner: Session;
  let intruder: Session;
  let characterId: string;

  const makeCharacter = (id: string, ownerId: string, name: string) =>
    new DnD5eCharacter({
      id,
      name,
      ownerUsername: ownerId,
      attributes: new Attributes({ STR: 10 }),
      hp: new HealthPoints(10, 10),
      level: 1,
    });

  beforeEach(async () => {
    owner = await createSignedInClient('owner');
    intruder = await createSignedInClient('intruder');
    characterId = crypto.randomUUID();
    await new SupabaseCharacterRepository(owner.client).save(
      makeCharacter(characterId, owner.userId, 'Original'),
    );
  });

  describe('characters', () => {
    it('lista do mais novo para o mais antigo, mesmo depois de salvar o mais antigo', async () => {
      const repo = new SupabaseCharacterRepository(owner.client);
      const newerId = crypto.randomUUID();
      await repo.save(makeCharacter(newerId, owner.userId, 'Newer'));
      await repo.save(makeCharacter(characterId, owner.userId, 'Original, edited'));

      const names = (await repo.findByOwner(owner.userId)).map((c) => c.name);
      expect(names).toEqual(['Newer', 'Original, edited']);
    });

    it('a lista do dono não traz fichas de inimigo', async () => {
      const npcId = crypto.randomUUID();
      const { error } = await SupabaseFactory.createAdmin()
        .from('characters')
        .insert({ id: npcId, owner_id: owner.userId, name: 'Goblin', kind: 'npc' });
      if (error) throw error;

      const names = (
        await new SupabaseCharacterRepository(owner.client).findByOwner(owner.userId)
      ).map((c) => c.name);

      expect(names).toEqual(['Original']);
    });

    it('o dono lê o próprio personagem', async () => {
      const character = await new SupabaseCharacterRepository(owner.client).findById(characterId);
      expect(character?.name).toBe('Original');
      expect(await new SupabaseCharacterRepository(owner.client).findOwnerId(characterId)).toBe(
        owner.userId,
      );
    });

    it('o intruso não enxerga o personagem', async () => {
      const repo = new SupabaseCharacterRepository(intruder.client);
      expect(await repo.findById(characterId)).toBeNull();
      expect(await repo.findOwnerId(characterId)).toBeNull();
      expect(await repo.findByOwner(owner.userId)).toEqual([]);
    });

    it('o intruso não sobrescreve o personagem via upsert, nem como dono falso', async () => {
      const repo = new SupabaseCharacterRepository(intruder.client);

      await expect(
        repo.save(makeCharacter(characterId, intruder.userId, 'Hijacked')),
      ).rejects.toThrow();
      await expect(repo.save(makeCharacter(characterId, owner.userId, 'Forged'))).rejects.toThrow();

      const character = await new SupabaseCharacterRepository(owner.client).findById(characterId);
      expect(character?.name).toBe('Original');
      expect(character?.ownerUsername).toBe(owner.userId);
    });

    it('o intruso não apaga o personagem', async () => {
      const deleted = await new SupabaseCharacterRepository(intruder.client).delete(characterId);

      expect(deleted).toBe(false);
      expect(
        await new SupabaseCharacterRepository(owner.client).findById(characterId),
      ).not.toBeNull();
    });

    it('o dono apaga o próprio personagem', async () => {
      const repo = new SupabaseCharacterRepository(owner.client);
      expect(await repo.delete(characterId)).toBe(true);
      expect(await repo.findById(characterId)).toBeNull();
      expect(await repo.findOwnerId(characterId)).toBeNull();
    });
  });

  describe('character_lore', () => {
    it('o dono salva e lê a lore; o intruso não lê nem escreve', async () => {
      await new SupabaseLoreRepository(owner.client).save(characterId, new Lore('30'));

      const intruderRepo = new SupabaseLoreRepository(intruder.client);
      expect(await intruderRepo.findByCharacterId(characterId)).toBeNull();
      await expect(intruderRepo.save(characterId, new Lore('99'))).rejects.toThrow();

      const lore = await new SupabaseLoreRepository(owner.client).findByCharacterId(characterId);
      expect(lore?.age).toBe('30');
    });
  });

  describe('character_spells', () => {
    const fireball = 'dnd5e:srd-5.1:spell:fireball';

    it('o intruso não aprende magias no personagem de outro', async () => {
      await expect(
        new SupabaseCharacterSpellRepository(intruder.client).learn(characterId, fireball),
      ).rejects.toThrow();
    });

    it('o dono aprende, prepara e esquece pela chave da magia', async () => {
      const repo = new SupabaseCharacterSpellRepository(owner.client);

      await repo.learn(characterId, fireball);
      await repo.togglePrepared(characterId, fireball, true);
      expect(await repo.findByCharacterId(characterId)).toEqual([
        expect.objectContaining({ ref: fireball, isPrepared: true }),
      ]);

      await repo.forget(characterId, fireball);
      expect(await repo.findByCharacterId(characterId)).toEqual([]);
    });

    it('o banco recusa referência fora do formato de chave', async () => {
      await expect(
        new SupabaseCharacterSpellRepository(owner.client).learn(characterId, 'fireball'),
      ).rejects.toThrow();
    });
  });

  describe('storage avatars', () => {
    const image = () => new Blob([new Uint8Array(8)], { type: 'image/png' });

    it('o usuário envia para a própria pasta', async () => {
      const url = await new SupabaseStorageRepository(owner.client).upload(
        'avatars',
        `${owner.userId}/avatar`,
        image(),
      );
      expect(url).toContain(owner.userId);
    });

    it('o usuário não envia para a pasta de outro', async () => {
      await expect(
        new SupabaseStorageRepository(intruder.client).upload(
          'avatars',
          `${owner.userId}/avatar`,
          image(),
        ),
      ).rejects.toThrow();
    });

    it('o bucket recusa tipos fora da lista, mesmo na pasta do próprio usuário', async () => {
      const svg = new Blob(['<svg><script>1</script></svg>'], { type: 'image/svg+xml' });
      const storage = new SupabaseStorageRepository(owner.client);
      await expect(storage.upload('avatars', `${owner.userId}/x.svg`, svg)).rejects.toThrow();
    });

    it('o usuário substitui o próprio arquivo (upsert)', async () => {
      const storage = new SupabaseStorageRepository(owner.client);
      const path = `${owner.userId}/avatar`;
      await storage.upload('avatars', path, image());

      await expect(storage.upload('avatars', path, image())).resolves.toContain(owner.userId);
    });

    it('a chave pública e o intruso não listam o bucket nem a pasta de outro', async () => {
      await new SupabaseStorageRepository(owner.client).upload(
        'avatars',
        `${owner.userId}/characters/${characterId}-v1.png`,
        image(),
      );
      const ownerStorage = owner.client.storage.from('avatars');
      const anon = SupabaseFactory.createAnon().storage.from('avatars');
      const intruderStorage = intruder.client.storage.from('avatars');

      // The owner still sees their own folder, so the empty listings below are not a broken list.
      const { data: own } = await ownerStorage.list(`${owner.userId}/characters`);
      expect(own?.map((file) => file.name)).toContain(`${characterId}-v1.png`);

      const listings = await Promise.all([
        anon.list(''),
        anon.list(owner.userId),
        anon.list(`${owner.userId}/characters`),
        intruderStorage.list(owner.userId),
        intruderStorage.list(`${owner.userId}/characters`),
      ]);
      expect(listings.map(({ data }) => data ?? [])).toEqual([[], [], [], [], []]);
    });

    it('o arquivo continua servido pelo endpoint público, sem sessão', async () => {
      const path = `${owner.userId}/avatar`;
      await new SupabaseStorageRepository(owner.client).upload('avatars', path, image());

      const avatars = SupabaseFactory.createAnon().storage.from('avatars');
      const response = await fetch(avatars.getPublicUrl(path).data.publicUrl);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('o dono apaga o próprio arquivo; o intruso não apaga o dos outros', async () => {
      const path = `${owner.userId}/avatar-to-remove.png`;
      const avatars = SupabaseFactory.createAnon().storage.from('avatars');
      const publicStatus = async () =>
        (await fetch(avatars.getPublicUrl(path).data.publicUrl)).status;
      await new SupabaseStorageRepository(owner.client).upload('avatars', path, image());

      // Storage answers without error even when RLS hides the file: check it is still served
      await new SupabaseStorageRepository(intruder.client).remove('avatars', path);
      expect(await publicStatus()).toBe(200);

      await new SupabaseStorageRepository(owner.client).remove('avatars', path);
      expect(await publicStatus()).not.toBe(200);
    });

    it('o bucket recusa arquivos acima de 5 MB', async () => {
      const big = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' });
      const storage = new SupabaseStorageRepository(owner.client);
      await expect(storage.upload('avatars', `${owner.userId}/big.png`, big)).rejects.toThrow();
    });
  });
});
