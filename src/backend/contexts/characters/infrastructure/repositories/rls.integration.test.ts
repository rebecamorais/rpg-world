import { beforeEach, describe, expect, it } from 'vitest';

import { Lore } from '@backend/contexts/lore';
import { SupabaseLoreRepository } from '@backend/contexts/lore/infrastructure/repositories/supabase-lore.repository';
import { SupabaseStorageRepository } from '@backend/shared/infrastructure/repositories/supabase-storage-repository';

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
    it('o dono lê o próprio personagem', async () => {
      const character = await new SupabaseCharacterRepository(owner.client).findById(characterId);
      expect(character?.name).toBe('Original');
    });

    it('o intruso não enxerga o personagem', async () => {
      const repo = new SupabaseCharacterRepository(intruder.client);
      expect(await repo.findById(characterId)).toBeNull();
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
    it('o intruso não aprende magias no personagem de outro', async () => {
      const spellId = crypto.randomUUID();
      await expect(
        new SupabaseCharacterSpellRepository(intruder.client).learn(characterId, spellId),
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
  });
});
