import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { UpdateCharacterUseCase } from '../../application/update-character/update-character.use-case';
import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { SupabaseCharacterRepository } from './supabase-character.repository';

// The same sheet in two tabs: A saves AC 20, B (still showing 12) saves 18. With revisions B gets a
// conflict instead of silently undoing A (fase-1-resultados, causa 2).
describe('revisão da ficha (Integration)', () => {
  let ownerId: string;
  let repo: SupabaseCharacterRepository;
  let useCase: UpdateCharacterUseCase;
  let characterId: string;

  beforeEach(async () => {
    const owner = await createSignedInClient('owner');
    ownerId = owner.userId;
    repo = new SupabaseCharacterRepository(owner.client);
    useCase = new UpdateCharacterUseCase(repo);
    characterId = crypto.randomUUID();
    await repo.save(
      new DnD5eCharacter({
        id: characterId,
        name: 'Arani',
        ownerUsername: ownerId,
        attributes: new Attributes({ STR: 10 }),
        hp: new HealthPoints(10, 10),
        level: 1,
        ac: 12,
      }),
    );
  });

  const save = (ac: number, revision?: number) =>
    useCase.execute({ id: characterId, ownerUsername: ownerId, updates: { ac }, revision });

  it('a ficha lida traz a revisão, e ela não vai parar no system_data', async () => {
    expect((await repo.findById(characterId))?.revision).toBe(0);
    expect((await save(14)).revision).toBe(1);

    const { data } = await SupabaseFactory.createAdmin()
      .from('characters')
      .select('revision, system_data')
      .eq('id', characterId)
      .single();
    expect(data?.revision).toBe(1);
    expect(data?.system_data).not.toHaveProperty('revision');
  });

  it('duas abas com a mesma revisão: a segunda recebe conflito e o servidor fica com a primeira', async () => {
    const seen = (await repo.findById(characterId))!.revision;

    expect((await save(20, seen)).revision).toBe(seen + 1);
    await expect(save(18, seen)).rejects.toMatchObject({
      code: CharacterErrorCodes.CONFLICT,
      details: { code: 'conflict', revision: seen + 1 },
    });
    expect(((await repo.findById(characterId)) as DnD5eCharacter).ac).toBe(20);
  });

  it('sem revisão continua salvando por cima (o app de antes)', async () => {
    await save(20, 0);
    expect((await save(18)).ac).toBe(18);
    expect(((await repo.findById(characterId)) as DnD5eCharacter).ac).toBe(18);
  });

  it('o dano do mestre entre o rascunho e o Salvar não dá conflito nem se perde', async () => {
    const seen = (await repo.findById(characterId))!.revision;
    await useCase.execute({ id: characterId, ownerUsername: ownerId, updates: { hpCurrent: 3 } });
    expect((await repo.findById(characterId))!.revision).toBe(seen);

    const saved = await save(20, seen);
    expect(saved.revision).toBe(seen + 1);
    const stored = (await repo.findById(characterId)) as DnD5eCharacter;
    expect(stored.ac).toBe(20);
    expect(stored.hp.current).toBe(3);
  });

  it('saveIfUnchanged com o row_version antigo não grava nada', async () => {
    const character = (await repo.findById(characterId)) as DnD5eCharacter;
    const stale = (await repo.findById(characterId)) as DnD5eCharacter;
    character.ac = 30;
    expect(await repo.saveIfUnchanged(character)).toBe(true);
    expect(character.revision).toBe(1);

    stale.ac = 40;
    expect(await repo.saveIfUnchanged(stale)).toBe(false);
    expect(((await repo.findById(characterId)) as DnD5eCharacter).ac).toBe(30);
  });
});
