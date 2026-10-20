import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { DeleteCharacterUseCase } from './delete-character.use-case';

describe('DeleteCharacterUseCase ', () => {
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

  it('apaga o avatar junto com o personagem', async () => {
    const storage = { remove: vi.fn().mockResolvedValue(undefined) };
    const withStorage = new DeleteCharacterUseCase(repo, storage as unknown as StorageRepository);
    const char = await repo.findById('char-1');
    char!.avatarUrl = 'https://images.rpgworldapp.com/avatars/owner-1/characters/char-1-v1.png';
    await repo.save(char!);

    await withStorage.execute('char-1', 'owner-1');

    expect(storage.remove).toHaveBeenCalledWith('avatars', 'owner-1/characters/char-1-v1.png');
  });

  it('não apaga avatar quem não é o dono', async () => {
    const storage = { remove: vi.fn() };
    const withStorage = new DeleteCharacterUseCase(repo, storage as unknown as StorageRepository);

    await expect(withStorage.execute('char-1', 'wrong-owner')).rejects.toThrow();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('deve lançar erro se tentar deletar um id que não existe', async () => {
    await expect(useCase.execute('not-exist', 'owner-1')).rejects.toThrowError(
      'character_error_delete_not_found',
    );
  });
});
