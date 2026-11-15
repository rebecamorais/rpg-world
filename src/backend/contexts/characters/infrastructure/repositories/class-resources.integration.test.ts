import { beforeEach, describe, expect, it } from 'vitest';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { UpdateCharacterUseCase } from '../../application/update-character/update-character.use-case';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { SupabaseCharacterRepository } from './supabase-character.repository';

describe('edição e recursos de classe (Integration)', () => {
  let ownerId: string;
  let repo: SupabaseCharacterRepository;
  let characterId: string;

  beforeEach(async () => {
    const owner = await createSignedInClient('owner');
    ownerId = owner.userId;
    repo = new SupabaseCharacterRepository(owner.client);
    characterId = crypto.randomUUID();
    await repo.save(
      new DnD5eCharacter({
        id: characterId,
        name: 'Monge',
        ownerUsername: ownerId,
        attributes: new Attributes({ STR: 10 }),
        hp: new HealthPoints(10, 10),
        level: 5,
        edition: '2024',
        resources: { 'class:monk:ki': { used: 2 } },
      }),
    );
  });

  it('salva e relê a edição e os recursos', async () => {
    const found = (await repo.findById(characterId)) as DnD5eCharacter;

    expect(found.edition).toBe('2024');
    expect(found.resources).toEqual({ 'class:monk:ki': { used: 2 } });
  });

  it('atualizar um recurso pelo caso de uso mantém os que já estavam salvos', async () => {
    const useCase = new UpdateCharacterUseCase(repo);

    await useCase.execute({
      id: characterId,
      ownerUsername: ownerId,
      updates: { resources: { 'class:monk:x': { used: 1 } } },
    });

    const found = (await repo.findById(characterId)) as DnD5eCharacter;
    expect(found.edition).toBe('2024');
    expect(found.resources).toEqual({
      'class:monk:ki': { used: 2 },
      'class:monk:x': { used: 1 },
    });
  });

  it('caixinha própria e edição da classe vão e voltam do banco; excluir tira a própria', async () => {
    const useCase = new UpdateCharacterUseCase(repo);
    const OWN = 'custom:0193a1b2-0000-7000-8000-000000000001';
    const ring = {
      name: 'Anel da Sorte',
      max: 3,
      recovery: [{ rest: 'long' as const, amount: 'all' as const }],
      color: '#ef4444',
      description: 'Rola de novo um d20.',
      source: 'item' as const,
    };
    const ki = { used: 2, hidden: true, overrides: { max: 4, name: 'Chi' } };

    await useCase.execute({
      id: characterId,
      ownerUsername: ownerId,
      updates: { resources: { 'class:monk:ki': ki, [OWN]: { used: 1, custom: ring } } },
    });
    const saved = (await repo.findById(characterId)) as DnD5eCharacter;
    expect(saved.resources).toEqual({ 'class:monk:ki': ki, [OWN]: { used: 1, custom: ring } });

    await useCase.execute({
      id: characterId,
      ownerUsername: ownerId,
      updates: { resources: { [OWN]: { used: 0 } } },
    });
    const after = (await repo.findById(characterId)) as DnD5eCharacter;
    expect(after.resources).toEqual({ 'class:monk:ki': ki });
  });
});
