import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { UploadCharacterAvatarUseCase } from './upload-character-avatar.use-case';

vi.mock('server-only', () => ({}));

const image = (type = 'image/png', size = 1024) => new Blob([new Uint8Array(size)], { type });

describe('UploadCharacterAvatarUseCase', () => {
  let characterRepo: InMemoryCharacterRepository;
  let storage: StorageRepository;
  let useCase: UploadCharacterAvatarUseCase;

  beforeEach(async () => {
    characterRepo = new InMemoryCharacterRepository();
    storage = {
      upload: vi
        .fn()
        .mockResolvedValue('https://images.test/avatars/owner-1/characters/char-1-v1.png'),
      download: vi.fn(),
      remove: vi.fn(),
    };
    useCase = new UploadCharacterAvatarUseCase(storage, characterRepo, () => 'v1');
    await characterRepo.save(
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

  it('envia o arquivo para a pasta do dono e retorna a URL', async () => {
    const url = await useCase.execute('char-1', 'owner-1', image());

    expect(storage.upload).toHaveBeenCalledWith(
      'avatars',
      'owner-1/characters/char-1-v1.png',
      expect.any(Blob),
    );
    expect(url).toContain('char-1-v1.png');
  });

  it('grava cada upload num caminho novo, para o cache imutável do proxy nunca servir a imagem antiga', async () => {
    const versions = ['v1', 'v2'];
    useCase = new UploadCharacterAvatarUseCase(storage, characterRepo, () => versions.shift()!);

    await useCase.execute('char-1', 'owner-1', image());
    await useCase.execute('char-1', 'owner-1', image());

    const paths = vi.mocked(storage.upload).mock.calls.map((c) => c[1]);
    expect(paths).toEqual(['owner-1/characters/char-1-v1.png', 'owner-1/characters/char-1-v2.png']);
  });

  it('proíbe upload no personagem de outro usuário', async () => {
    await expect(useCase.execute('char-1', 'intruder', image())).rejects.toThrow(
      CharacterErrorCodes.ACCESS_FORBIDDEN,
    );
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('responde not found para personagem inexistente', async () => {
    await expect(useCase.execute('missing', 'owner-1', image())).rejects.toThrow(
      CharacterErrorCodes.ACCESS_NOT_FOUND,
    );
  });

  it('rejeita arquivo maior que 5 MB, o limite do bucket', async () => {
    await expect(
      useCase.execute('char-1', 'owner-1', image('image/png', 5 * 1024 * 1024 + 1)),
    ).rejects.toThrow(CharacterErrorCodes.AVATAR_FILE_TOO_LARGE);
  });

  it('aceita arquivo de até 5 MB', async () => {
    await expect(
      useCase.execute('char-1', 'owner-1', image('image/png', 5 * 1024 * 1024)),
    ).resolves.toBeDefined();
  });

  it('rejeita tipo de arquivo não suportado', async () => {
    await expect(useCase.execute('char-1', 'owner-1', image('image/gif'))).rejects.toThrow(
      CharacterErrorCodes.AVATAR_INVALID_TYPE,
    );
  });

  describe('com a imagem completa', () => {
    const webp = (size = 1024) => image('image/webp', size);

    it('grava a completa com o nome normal e o avatar com sufixo', async () => {
      vi.mocked(storage.upload).mockImplementation(
        async (_, path) => `https://images.test/${path}`,
      );

      const url = await useCase.execute('char-1', 'owner-1', webp(), webp());

      expect(vi.mocked(storage.upload).mock.calls.map((c) => c[1])).toEqual([
        'owner-1/characters/char-1-v1.webp',
        'owner-1/characters/char-1-v1-avatar.webp',
      ]);
      expect(url).toBe('https://images.test/owner-1/characters/char-1-v1-avatar.webp');
    });

    it('recusa completa acima do limite, sem gravar nada', async () => {
      await expect(
        useCase.execute('char-1', 'owner-1', webp(), webp(5 * 1024 * 1024 + 1)),
      ).rejects.toThrow(CharacterErrorCodes.AVATAR_FILE_TOO_LARGE);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('recusa completa de tipo proibido, sem gravar nada', async () => {
      await expect(
        useCase.execute('char-1', 'owner-1', image('image/gif'), image('image/gif')),
      ).rejects.toThrow(CharacterErrorCodes.AVATAR_INVALID_TYPE);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('recusa tipos diferentes entre os dois, sem gravar nada', async () => {
      await expect(
        useCase.execute('char-1', 'owner-1', webp(), image('image/jpeg')),
      ).rejects.toThrow(CharacterErrorCodes.AVATAR_INVALID_TYPE);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('se gravar o avatar falhar, apaga a completa e repassa o erro', async () => {
      vi.mocked(storage.upload)
        .mockResolvedValueOnce('https://images.test/full')
        .mockRejectedValueOnce(new Error('storage fora do ar'));

      await expect(useCase.execute('char-1', 'owner-1', webp(), webp())).rejects.toThrow(
        'storage fora do ar',
      );
      expect(storage.remove).toHaveBeenCalledWith('avatars', 'owner-1/characters/char-1-v1.webp');
    });

    it('uma falha ao apagar a completa não esconde o erro original', async () => {
      vi.mocked(storage.upload)
        .mockResolvedValueOnce('https://images.test/full')
        .mockRejectedValueOnce(new Error('storage fora do ar'));
      vi.mocked(storage.remove).mockRejectedValue(new Error('outra falha'));

      await expect(useCase.execute('char-1', 'owner-1', webp(), webp())).rejects.toThrow(
        'storage fora do ar',
      );
    });
  });
});
