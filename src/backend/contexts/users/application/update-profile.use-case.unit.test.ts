import { describe, expect, it, vi } from 'vitest';

import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/ProfileRepository';
import { GetProfileUseCase } from './get-profile.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';

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
      const useCase = new UpdateProfileUseCase(repository, storage as unknown as StorageRepository);
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
