import { beforeEach, describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetCharactersByOwnerUseCase } from './get-characters-by-owner.use-case';

describe('GetCharactersByOwnerUseCase (Integration)', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: GetCharactersByOwnerUseCase;

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    useCase = new GetCharactersByOwnerUseCase(repo);
  });

  it('deve retornar a lista de personagens de um usuário específico', async () => {
    const char1 = new DnD5eCharacter(
      'char-1',
      'Aragorn',
      'user1',
      new Attributes(),
      new HealthPoints(10, 10),
      1,
    );
    const char2 = new DnD5eCharacter(
      'char-2',
      'Legolas',
      'user1',
      new Attributes(),
      new HealthPoints(10, 10),
      1,
    );
    const char3 = new DnD5eCharacter(
      'char-3',
      'Gimli',
      'user2',
      new Attributes(),
      new HealthPoints(10, 10),
      1,
    );

    await repo.save(char1);
    await repo.save(char2);
    await repo.save(char3);

    const result = await useCase.execute('user1');

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name)).toContain('Aragorn');
    expect(result.map((c) => c.name)).toContain('Legolas');
  });

  it('deve retornar lista vazia se o dono não tiver personagens', async () => {
    const result = await useCase.execute('user-without-chars');
    expect(result).toEqual([]);
  });

  it('deve lançar erro se não for fornecido um username', async () => {
    await expect(useCase.execute('')).rejects.toThrowError(
      'Owner username is required',
    );
  });
});
