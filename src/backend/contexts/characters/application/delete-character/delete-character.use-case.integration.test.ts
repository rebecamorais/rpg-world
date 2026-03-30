import { beforeEach, describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { DeleteCharacterUseCase } from './delete-character.use-case';

describe('DeleteCharacterUseCase (Integration)', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: DeleteCharacterUseCase;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    useCase = new DeleteCharacterUseCase(repo);

    const char = new DnD5eCharacter({
      id: 'char-1',
      name: 'Test',
      ownerUsername: 'owner-1',
      attributes: new Attributes(),
      hp: new HealthPoints(10, 10),
      level: 1,
    });
    await repo.save(char);
  });

  it('deve deletar um personagem se o dono requisitar', async () => {
    const deleted = await useCase.execute('char-1', 'owner-1');
    expect(deleted).toBe(true);

    const found = await repo.findById('char-1');
    expect(found).toBeNull();
  });

  it('não deve deletar se o usuário não for o dono', async () => {
    await expect(useCase.execute('char-1', 'wrong-owner')).rejects.toThrowError(
      'character_error_delete_unauthorized',
    );

    // Ensure it's still there
    const found = await repo.findById('char-1');
    expect(found).not.toBeNull();
  });

  it('deve lançar erro se tentar deletar um id que não existe', async () => {
    await expect(useCase.execute('not-exist', 'owner-1')).rejects.toThrowError(
      'character_error_delete_not_found',
    );
  });
});
