import { beforeEach, describe, expect, it } from 'vitest';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetCharacterUseCase } from './get-characters.use-case';

describe('GetCharacterUseCase', () => {
  let useCase: GetCharacterUseCase;

  beforeEach(async () => {
    const repo = new InMemoryCharacterRepository();
    useCase = new GetCharacterUseCase(repo);
    await repo.save(
      new DnD5eCharacter({
        id: 'char-1',
        name: 'Hero',
        ownerUsername: 'owner-1',
        attributes: new Attributes(),
        hp: new HealthPoints(10, 10),
        level: 1,
      }),
    );
  });

  it('retorna o personagem para o dono', async () => {
    const character = await useCase.execute('char-1', 'owner-1');
    expect(character.name).toBe('Hero');
  });

  it('responde not found para outro usuário', async () => {
    await expect(useCase.execute('char-1', 'intruder')).rejects.toThrow(
      CharacterErrorCodes.GET_NOT_FOUND,
    );
  });
});
