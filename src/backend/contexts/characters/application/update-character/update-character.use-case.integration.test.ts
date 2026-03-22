import { beforeEach, describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { UpdateCharacterUseCase } from './update-character.use-case';

describe('UpdateCharacterUseCase (Integration)', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: UpdateCharacterUseCase;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    useCase = new UpdateCharacterUseCase(repo);

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

  it('deve atualizar múltiplos campos de uma só vez', async () => {
    await useCase.execute({
      id: 'char-1',
      ownerUsername: 'owner-1',
      updates: {
        name: 'Test Updated',
        hpCurrent: 5,
        spellsKnown: ['fireball'],
      },
    });

    const updated = (await repo.findById('char-1')) as DnD5eCharacter;
    expect(updated.name).toBe('Test Updated');
    expect(updated.hp.status.current).toBe(5);
    expect(updated.spellsKnown).toContain('fireball');
  });

  it('não deve permitir alteração se não for o dono', async () => {
    await expect(
      useCase.execute({
        id: 'char-1',
        ownerUsername: 'hacker-user',
        updates: { name: 'Hacked' },
      }),
    ).rejects.toThrowError('character_error_update_unauthorized');
  });
});
