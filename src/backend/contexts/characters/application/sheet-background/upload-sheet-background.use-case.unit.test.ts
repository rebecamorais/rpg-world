import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { removeCharacterSheetBackground } from './sheet-background-file';
import { UploadSheetBackgroundUseCase } from './upload-sheet-background.use-case';

vi.mock('server-only', () => ({}));

const image = (type = 'image/webp', size = 1024) => new Blob([new Uint8Array(size)], { type });
const url = (path: string) => `https://images.rpgworldapp.com/avatars/${path}`;

describe('fundo da ficha', () => {
  let storage: StorageRepository;

  beforeEach(() => {
    storage = {
      upload: vi.fn(async (_bucket: string, path: string) => url(path)),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageRepository;
  });

  describe('UploadSheetBackgroundUseCase', () => {
    let useCase: UploadSheetBackgroundUseCase;

    beforeEach(async () => {
      const repository = new InMemoryCharacterRepository();
      await repository.save(
        new DnD5eCharacter({
          id: 'char-a',
          name: 'Arani',
          ownerUsername: 'owner',
          level: 1,
          attributes: new Attributes({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
          hp: new HealthPoints(10, 10),
        }),
      );
      useCase = new UploadSheetBackgroundUseCase(storage, repository, () => 'v1');
    });

    it('grava um arquivo versionado na pasta do dono e devolve a URL', async () => {
      const file = image();

      const result = await useCase.execute('char-a', 'owner', file);

      const path = 'owner/characters/char-a-background-v1.webp';
      expect(storage.upload).toHaveBeenCalledWith('avatars', path, file);
      expect(result).toBe(url(path));
    });

    it('recusa quem não é o dono, sem gravar nada', async () => {
      await expect(useCase.execute('char-a', 'stranger', image())).rejects.toThrow();
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('recusa um tipo que não é imagem', async () => {
      await expect(useCase.execute('char-a', 'owner', image('text/html'))).rejects.toMatchObject({
        code: CharacterErrorCodes.AVATAR_INVALID_TYPE,
      });
      expect(storage.upload).not.toHaveBeenCalled();
    });
  });

  describe('removeCharacterSheetBackground', () => {
    const character = { id: 'char-a', ownerUsername: 'owner' };

    it('apaga o arquivo anterior quando ele deixou de ser o fundo', async () => {
      await removeCharacterSheetBackground(
        storage,
        character,
        url('owner/characters/char-a-background-v1.webp'),
      );

      expect(storage.remove).toHaveBeenCalledWith(
        'avatars',
        'owner/characters/char-a-background-v1.webp',
      );
    });

    it('mantém o arquivo que continua sendo o fundo', async () => {
      const current = url('owner/characters/char-a-background-v1.webp');

      await removeCharacterSheetBackground(
        storage,
        { ...character, sheetBackgroundUrl: current },
        current,
      );

      expect(storage.remove).not.toHaveBeenCalled();
    });

    it.each([
      ['de outro personagem', 'owner/characters/char-b-background-v1.webp'],
      ['o avatar do personagem', 'owner/characters/char-a-v1-avatar.webp'],
      ['de outra pessoa', 'other/characters/char-a-background-v1.webp'],
    ])('nunca apaga um arquivo %s', async (_name, path) => {
      await removeCharacterSheetBackground(storage, character, url(path));

      expect(storage.remove).not.toHaveBeenCalled();
    });
  });
});
