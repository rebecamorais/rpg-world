import { beforeEach, describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { UpdateCharacterAttributeUseCase } from './update-character-attribute.use-case';

describe('UpdateCharacterAttributeUseCase (Integration)', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: UpdateCharacterAttributeUseCase;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    useCase = new UpdateCharacterAttributeUseCase(repo);

    const char = new DnD5eCharacter(
      'char-1',
      'Test',
      'owner-1',
      new Attributes({ STR: 10 }),
      new HealthPoints(10, 10),
      1,
    );
    await repo.save(char);
  });

  it('deve alterar o atributo com sucesso', async () => {
    await useCase.execute({
      id: 'char-1',
      ownerUsername: 'owner-1',
      attribute: 'STR',
      value: 18,
    });

    const updated = (await repo.findById('char-1')) as DnD5eCharacter;
    expect(updated.attributes.get('STR')).toBe(18);
  });

  it('não deve permitir alteração se não for o dono', async () => {
    await expect(
      useCase.execute({
        id: 'char-1',
        ownerUsername: 'hacker-user',
        attribute: 'STR',
        value: 30,
      }),
    ).rejects.toThrowError('Não autorizado a modificar este personagem.');
  });
});
