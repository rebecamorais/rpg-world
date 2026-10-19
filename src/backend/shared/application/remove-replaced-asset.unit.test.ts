import { describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '../domain/StorageRepository';
import { isFileIn, removeReplacedAsset, storagePathFromAssetUrl } from './remove-replaced-asset';

const USER = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';

describe('storagePathFromAssetUrl', () => {
  it.each([
    [`https://images.rpgworldapp.com/avatars/${USER}/avatar-v1.png`],
    [`https://rpg.test/api/images/avatars/${USER}/avatar-v1.png`],
    [`https://ref.supabase.co/storage/v1/object/public/avatars/${USER}/avatar-v1.png`],
  ])('acha o caminho no bucket em %s', (url) => {
    expect(storagePathFromAssetUrl(url, 'avatars')).toBe(`${USER}/avatar-v1.png`);
  });

  it.each([
    ['não é URL', 'not a url'],
    ['outro bucket', `https://images.rpgworldapp.com/docs/${USER}/a.png`],
    ['sem arquivo', 'https://images.rpgworldapp.com/avatars'],
  ])('devolve null quando %s', (_label, url) => {
    expect(storagePathFromAssetUrl(url, 'avatars')).toBeNull();
  });

  it('resolve "..", então o caminho sai da pasta do usuário e não passa no isFileIn', () => {
    const path = storagePathFromAssetUrl(
      `https://x.test/avatars/${USER}/%2E%2E/other/avatar-v1.png`,
      'avatars',
    );

    expect(path).toBe('other/avatar-v1.png');
    expect(isFileIn(path!, USER, 'avatar-')).toBe(false);
  });
});

describe('isFileIn', () => {
  it('aceita só arquivos direto na pasta e com o prefixo pedido', () => {
    expect(isFileIn(`${USER}/avatar-v1.png`, USER, 'avatar-')).toBe(true);
    expect(isFileIn(`${USER}/characters/c-v1.png`, USER, 'avatar-')).toBe(false);
    expect(isFileIn(`${USER}/other.png`, USER, 'avatar-')).toBe(false);
    expect(isFileIn(`other/avatar-v1.png`, USER, 'avatar-')).toBe(false);
    expect(isFileIn(`${USER}x/avatar-v1.png`, USER, 'avatar-')).toBe(false);
  });
});

describe('removeReplacedAsset', () => {
  const storage = () => ({ remove: vi.fn().mockResolvedValue(undefined) });
  const OLD = `https://images.rpgworldapp.com/avatars/${USER}/avatar-v1.png`;
  const NEW = `https://images.rpgworldapp.com/avatars/${USER}/avatar-v2.png`;
  const removable = (path: string) => isFileIn(path, USER, 'avatar-');

  it('apaga o arquivo anterior quando a URL muda', async () => {
    const repo = storage();
    await removeReplacedAsset(repo as unknown as StorageRepository, 'avatars', OLD, NEW, removable);

    expect(repo.remove).toHaveBeenCalledWith('avatars', `${USER}/avatar-v1.png`);
  });

  it('apaga também quando o avatar é removido', async () => {
    const repo = storage();
    await removeReplacedAsset(repo as unknown as StorageRepository, 'avatars', OLD, '', removable);

    expect(repo.remove).toHaveBeenCalledOnce();
  });

  it.each([
    ['não havia avatar', undefined, NEW],
    ['a URL não mudou', OLD, OLD],
    ['a URL antiga é de fora', 'https://cdn.example.com/me.png', NEW],
    ['o arquivo não é do tipo esperado', `https://x.test/avatars/${USER}/characters/c-v1.png`, NEW],
  ])('não apaga nada quando %s', async (_label, previous, current) => {
    const repo = storage();
    await removeReplacedAsset(
      repo as unknown as StorageRepository,
      'avatars',
      previous,
      current,
      removable,
    );

    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('não falha o salvamento quando o storage não consegue apagar', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = { remove: vi.fn().mockRejectedValue(new Error('storage down')) };

    await expect(
      removeReplacedAsset(repo as unknown as StorageRepository, 'avatars', OLD, NEW, removable),
    ).resolves.toBeUndefined();
  });
});
