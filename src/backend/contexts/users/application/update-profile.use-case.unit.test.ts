import { describe, expect, it, vi } from 'vitest';

import { storagePathFromAssetUrl } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/storage.repo';

import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/profile.repo';
import { GetProfileUseCase } from './get-profile.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';

const ASSETS = 'https://images.rpgworldapp.com';
/** The asset host of these tests, as `ownAssetPath` answers in production. */
const ownAssetPath = (url: string, bucket: string) => storagePathFromAssetUrl(url, bucket, ASSETS);

const mockProfileRepository = () =>
  ({
    getById: vi.fn(),
    update: vi.fn(),
  }) as unknown as ProfileRepository;

describe('UpdateProfileUseCase', () => {
  it('deve chamar update no repositório com o perfil correto', async () => {
    const repository = mockProfileRepository();
    (repository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const useCase = new UpdateProfileUseCase(repository);
    const profile: Profile = {
      id: 'user-123',
      username: 'rebeca',
      fullName: 'Rebeca Morais',
    };

    await useCase.execute(profile);

    expect(repository.update).toHaveBeenCalledOnce();
    expect(repository.update).toHaveBeenCalledWith(profile);
  });

  it('deve lançar erro se o ID não for fornecido', async () => {
    const repository = mockProfileRepository();
    const useCase = new UpdateProfileUseCase(repository);
    const profile = {} as Profile;

    await expect(useCase.execute(profile)).rejects.toThrow('profile_error_update_id_required');
    expect(repository.update).not.toHaveBeenCalled();
  });

  describe('username', () => {
    function setup(previousUsername: string) {
      const repository = mockProfileRepository();
      (repository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user-123',
        username: previousUsername,
        avatarUrl: 'https://images.rpgworldapp.com/avatars/user-123/avatar-v1.png',
      });
      const storage = { remove: vi.fn().mockResolvedValue(undefined) };
      const useCase = new UpdateProfileUseCase(repository, storage as unknown as StorageRepository);
      return { repository, storage, useCase };
    }

    it.each([
      ['com espaço', 'mestre '],
      ['com caractere invisível', 'mes\u200btre'],
      ['com "е" cirílico', 'mestr\u0435'],
      ['com maiúscula', 'Mestre'],
      ['com HTML', '<b>x</b>'],
    ])('recusa um username novo %s', async (_, username) => {
      const { repository, useCase } = setup('aria_bold');

      await expect(useCase.execute({ id: 'user-123', username })).rejects.toMatchObject({
        code: 'profile_error_username_invalid',
      });
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('aceita um username novo no formato', async () => {
      const { repository, useCase } = setup('aria_bold');

      await useCase.execute({ id: 'user-123', username: 'corvo_99' });

      expect(repository.update).toHaveBeenCalledWith({ id: 'user-123', username: 'corvo_99' });
    });

    it('salva o perfil com o username antigo fora do formato, sem mexer nele', async () => {
      const { repository, useCase } = setup('playerChilli');
      const profile = { id: 'user-123', username: 'playerChilli', fullName: 'Chilli' };

      await useCase.execute(profile);

      expect(repository.update).toHaveBeenCalledWith(profile);
    });

    it('trocar só o username não apaga o avatar', async () => {
      const { storage, useCase } = setup('aria_bold');

      await useCase.execute({ id: 'user-123', username: 'corvo_99' });

      expect(storage.remove).not.toHaveBeenCalled();
    });
  });

  describe('avatar substituído', () => {
    const USER = 'user-123';
    const url = (version: string) =>
      `https://images.rpgworldapp.com/avatars/${USER}/avatar-${version}.png`;

    function setup(previousAvatarUrl?: string) {
      const repository = mockProfileRepository();
      (repository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: USER,
        avatarUrl: previousAvatarUrl,
      });
      const storage = { remove: vi.fn().mockResolvedValue(undefined) };
      const useCase = new UpdateProfileUseCase(
        repository,
        storage as unknown as StorageRepository,
        ownAssetPath,
      );
      return { repository, storage, useCase };
    }

    it('apaga o arquivo anterior depois de salvar o novo avatar', async () => {
      const { repository, storage, useCase } = setup(url('v1'));

      await useCase.execute({ id: USER, avatarUrl: url('v2') });

      expect(repository.update).toHaveBeenCalled();
      expect(storage.remove).toHaveBeenCalledWith('avatars', `${USER}/avatar-v1.png`);
    });

    it('não mexe no storage quando o avatar não faz parte da atualização', async () => {
      const { repository, storage, useCase } = setup(url('v1'));

      await useCase.execute({ id: USER, fullName: 'Rebeca' });

      expect(repository.getById).not.toHaveBeenCalled();
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('não apaga arquivos que não são avatares de perfil deste usuário', async () => {
      const { storage, useCase } = setup(
        'https://images.rpgworldapp.com/avatars/other-user/avatar-v1.png',
      );

      await useCase.execute({ id: USER, avatarUrl: url('v2') });

      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('recusa o arquivo de outra conta ou de outro site como avatar', async () => {
      const { repository, useCase } = setup(url('v1'));

      for (const avatarUrl of [
        'https://images.rpgworldapp.com/avatars/other-user/avatar-v1.png',
        `https://evil.example/avatars/${USER}/avatar-v2.png`,
        // The bucket has to come right after the host, not anywhere further along the path
        `${ASSETS}/other/x/avatars/${USER}/avatar-v2.png`,
        // Another file of this account's folder that isn't a profile picture
        `${ASSETS}/avatars/${USER}/characters/char-1-v1.webp`,
      ]) {
        await expect(useCase.execute({ id: USER, avatarUrl })).rejects.toMatchObject({
          code: 'profile_error_avatar_invalid',
        });
      }
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('aceita o que foi enviado para esta conta', async () => {
      const { repository, useCase } = setup(url('v1'));

      await useCase.execute({ id: USER, avatarUrl: url('v2') });

      expect(repository.update).toHaveBeenCalledWith({ id: USER, avatarUrl: url('v2') });
    });

    // Saved before the check (the profile form sends it back with every save)
    it('uma imagem de fora salva antes continua valendo se voltar igual', async () => {
      const old = `${ASSETS}/other/x/avatars/${USER}/avatar-v1.png`;
      const { repository, storage, useCase } = setup(old);

      await useCase.execute({ id: USER, avatarUrl: old, fullName: 'Rebeca' });

      expect(repository.update).toHaveBeenCalledWith({
        id: USER,
        avatarUrl: old,
        fullName: 'Rebeca',
      });
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('aceita o avatar que a conta já tem (a foto do Google) e o vazio, que apaga', async () => {
      const google = 'https://lh3.googleusercontent.com/a/photo';
      const { repository, storage, useCase } = setup(google);

      await useCase.execute({ id: USER, avatarUrl: google });
      await useCase.execute({ id: USER, avatarUrl: '' });

      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('não apaga nada se o salvamento falhar', async () => {
      const { repository, storage, useCase } = setup(url('v1'));
      (repository.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('db down'));

      await expect(useCase.execute({ id: USER, avatarUrl: url('v2') })).rejects.toThrow('db down');
      expect(storage.remove).not.toHaveBeenCalled();
    });
  });
});

describe('GetProfileUseCase', () => {
  it('deve retornar o perfil pelo ID', async () => {
    const repository = mockProfileRepository();
    const expectedProfile: Profile = { id: 'user-123', username: 'rebeca' };
    (repository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(expectedProfile);

    const useCase = new GetProfileUseCase(repository);
    const result = await useCase.execute('user-123');

    expect(repository.getById).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(expectedProfile);
  });

  it('deve retornar null se o perfil não for encontrado', async () => {
    const repository = mockProfileRepository();
    (repository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const useCase = new GetProfileUseCase(repository);
    const result = await useCase.execute('nao-existe');

    expect(result).toBeNull();
  });

  it('deve lançar erro se o ID não for fornecido', async () => {
    const repository = mockProfileRepository();
    const useCase = new GetProfileUseCase(repository);

    await expect(useCase.execute('')).rejects.toThrow('profile_error_get_id_required');
  });
});
