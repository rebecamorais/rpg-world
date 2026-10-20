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
});
