import { describe, expect, it, vi } from 'vitest';

import { Profile } from '../domain/Profile';
import { ProfileRepository } from '../domain/ProfileRepository';
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from './update-profile.use-case';

const mockProfileRepository = (): ProfileRepository => ({
  getById: vi.fn(),
  update: vi.fn(),
});

describe('UpdateProfileUseCase', () => {
  it('deve chamar update no repositório com o perfil correto', async () => {
    const repository = mockProfileRepository();
    (repository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

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

    await expect(useCase.execute(profile)).rejects.toThrow(
      'Profile ID is required',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('GetProfileUseCase', () => {
  it('deve retornar o perfil pelo ID', async () => {
    const repository = mockProfileRepository();
    const expectedProfile: Profile = { id: 'user-123', username: 'rebeca' };
    (repository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      expectedProfile,
    );

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

    await expect(useCase.execute('')).rejects.toThrow('User ID is required');
  });
});
