import { describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '../domain/StorageRepository';
import { CleanupOrphanAvatarsUseCase } from './cleanup-orphan-avatars.use-case';

function setup(orphans: string[]) {
  const finder = { findOrphans: vi.fn().mockResolvedValue(orphans) };
  const storage = { remove: vi.fn().mockResolvedValue(undefined) };
  const useCase = new CleanupOrphanAvatarsUseCase(finder, storage as unknown as StorageRepository);
  return { storage, useCase };
}

describe('CleanupOrphanAvatarsUseCase', () => {
  it('apaga os órfãos em lotes de 100 e diz quantos foram', async () => {
    const orphans = Array.from({ length: 250 }, (_, i) => `user/avatar-${i}.png`);
    const { storage, useCase } = setup(orphans);

    await expect(useCase.execute()).resolves.toEqual({ removed: 250 });

    expect(storage.remove).toHaveBeenCalledTimes(3);
    expect(storage.remove.mock.calls.map(([, paths]) => paths.length)).toEqual([100, 100, 50]);
    expect(storage.remove).toHaveBeenCalledWith('avatars', orphans.slice(0, 100));
  });

  it('não chama o storage quando não há órfãos', async () => {
    const { storage, useCase } = setup([]);

    await expect(useCase.execute()).resolves.toEqual({ removed: 0 });
    expect(storage.remove).not.toHaveBeenCalled();
  });

  describe('imagens completas, que nenhuma linha do banco cita', () => {
    const removed = (storage: ReturnType<typeof setup>['storage']) =>
      storage.remove.mock.calls.flatMap(([, paths]) => paths);

    it('guarda a completa cujo avatar está em uso e apaga o resto', async () => {
      const inUse = 'u/characters/c-1.webp'; // its -avatar isn't an orphan: something uses it
      const pair = ['u/characters/c-2.webp', 'u/characters/c-2-avatar.webp'];
      const profile = 'u/avatar-3.webp';
      const { storage, useCase } = setup([inUse, ...pair, profile]);

      await expect(useCase.execute()).resolves.toEqual({ removed: 3 });

      expect(removed(storage)).toEqual([...pair, profile]);
    });

    it('avatar órfão sai mesmo sem a completa na lista', async () => {
      const { storage, useCase } = setup(['u/characters/c-1-avatar.webp']);

      await useCase.execute();

      expect(removed(storage)).toEqual(['u/characters/c-1-avatar.webp']);
    });
  });
});
