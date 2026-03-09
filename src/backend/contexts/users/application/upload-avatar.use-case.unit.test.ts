import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { describe, expect, it, vi } from 'vitest';

import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  UploadAvatarUseCase,
} from './upload-avatar.use-case';

const mockStorageRepository = (): StorageRepository => ({
  upload: vi.fn(),
});

const makeBlob = (type: string, sizeBytes: number): Blob => {
  return new Blob([new Uint8Array(sizeBytes)], { type });
};

describe('UploadAvatarUseCase', () => {
  it('deve fazer upload e retornar a URL pública', async () => {
    const repository = mockStorageRepository();
    const publicUrl = 'https://cdn.example.com/avatars/user-1/avatar.webp';
    (repository.upload as ReturnType<typeof vi.fn>).mockResolvedValue(
      publicUrl,
    );

    const useCase = new UploadAvatarUseCase(repository);
    const file = makeBlob('image/webp', 1024);

    const result = await useCase.execute('user-1', file);

    expect(result).toBe(publicUrl);
    expect(repository.upload).toHaveBeenCalledWith(
      'avatars',
      'user-1/avatar.webp',
      file,
    );
  });

  it('deve lançar erro quando userId não for fornecido', async () => {
    const repository = mockStorageRepository();
    const useCase = new UploadAvatarUseCase(repository);
    const file = makeBlob('image/webp', 1024);

    await expect(useCase.execute('', file)).rejects.toThrow(
      'User ID is required',
    );
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando o arquivo exceder 5 MB', async () => {
    const repository = mockStorageRepository();
    const useCase = new UploadAvatarUseCase(repository);
    const bigFile = makeBlob('image/webp', MAX_AVATAR_SIZE_BYTES + 1);

    await expect(useCase.execute('user-1', bigFile)).rejects.toThrow(
      'File size exceeds the 5 MB limit',
    );
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it('deve lançar erro para tipos de arquivo não permitidos', async () => {
    const repository = mockStorageRepository();
    const useCase = new UploadAvatarUseCase(repository);
    const invalidFile = makeBlob('image/gif', 1024);

    await expect(useCase.execute('user-1', invalidFile)).rejects.toThrow(
      'Invalid file type',
    );
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it.each(ALLOWED_AVATAR_TYPES)(
    'deve aceitar o tipo de arquivo %s',
    async (type) => {
      const repository = mockStorageRepository();
      (repository.upload as ReturnType<typeof vi.fn>).mockResolvedValue(
        'https://cdn.example.com/url',
      );

      const useCase = new UploadAvatarUseCase(repository);
      const file = makeBlob(type, 1024);

      await expect(useCase.execute('user-1', file)).resolves.toBeDefined();
    },
  );
});
