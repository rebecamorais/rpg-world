import { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupabaseStorageRepository } from './supabase-storage-repository';

vi.mock('server-only', () => ({}));
vi.mock('../helpers/format-asset-url', () => ({
  formatAssetUrl: (path: string) => `https://images.rpgworldapp.com/${path}`,
}));

describe('SupabaseStorageRepository', () => {
  let mockAdminClient: InstanceType<typeof SupabaseClient>;
  let repository: SupabaseStorageRepository;

  beforeEach(() => {
    mockAdminClient = {
      storage: {
        from: vi.fn(),
      },
    } as unknown as InstanceType<typeof SupabaseClient>;

    repository = new SupabaseStorageRepository(mockAdminClient);
  });

  describe('upload', () => {
    it('should upload a file and return a proxy-formatted URL', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        upload: mockUpload,
      } as never);

      const file = new Blob(['test'], { type: 'image/png' });
      const result = await repository.upload('avatars', 'user-123/avatar', file);

      expect(mockAdminClient.storage.from).toHaveBeenCalledWith('avatars');
      expect(mockUpload).toHaveBeenCalledWith('user-123/avatar', file, {
        upsert: true,
        contentType: 'image/png',
      });
      // Should return proxy URL with bucket as first segment
      expect(result).toBe('https://images.rpgworldapp.com/avatars/user-123/avatar');
    });

    it('should throw an error when upload fails', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        error: { message: 'Bucket not found' },
      });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        upload: mockUpload,
      } as never);

      const file = new Blob(['test'], { type: 'image/png' });

      await expect(repository.upload('avatars', 'user-123/avatar', file)).rejects.toThrow(
        'Storage upload failed: Bucket not found',
      );
    });
  });

  describe('download', () => {
    it('should download a file and return data with content type', async () => {
      const mockBlob = new Blob(['image-data'], { type: 'image/webp' });
      const mockDownload = vi.fn().mockResolvedValue({ data: mockBlob, error: null });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        download: mockDownload,
      } as never);

      const result = await repository.download('rpg-assets', 'maps/dungeon.webp');

      expect(mockAdminClient.storage.from).toHaveBeenCalledWith('rpg-assets');
      expect(mockDownload).toHaveBeenCalledWith('maps/dungeon.webp');
      expect(result.data).toBe(mockBlob);
      expect(result.contentType).toBe('image/webp');
    });

    it('should fallback to application/octet-stream when blob has no type', async () => {
      const mockBlob = new Blob(['raw-data']);
      Object.defineProperty(mockBlob, 'type', { value: '' });
      const mockDownload = vi.fn().mockResolvedValue({ data: mockBlob, error: null });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        download: mockDownload,
      } as never);

      const result = await repository.download('rpg-assets', 'data/raw.bin');

      expect(result.contentType).toBe('application/octet-stream');
    });

    it('should throw an error when download fails', async () => {
      const mockDownload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Object not found' },
      });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        download: mockDownload,
      } as never);

      await expect(repository.download('rpg-assets', 'missing.png')).rejects.toThrow(
        'Storage download failed: Object not found',
      );
    });

    it('should throw when data is null even without error', async () => {
      const mockDownload = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(mockAdminClient.storage.from).mockReturnValue({
        download: mockDownload,
      } as never);

      await expect(repository.download('rpg-assets', 'missing.png')).rejects.toThrow(
        'Storage download failed: File not found',
      );
    });
  });
});
