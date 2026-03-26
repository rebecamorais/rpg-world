import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatAssetUrl } from './format-asset-url';

describe('formatAssetUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('production environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should return the production URL with https://images.rpgworldapp.com/', () => {
      expect(formatAssetUrl('avatars/user-123/avatar')).toBe(
        'https://images.rpgworldapp.com/avatars/user-123/avatar',
      );
    });

    it('should strip leading slash from path', () => {
      expect(formatAssetUrl('/avatars/user-123/avatar')).toBe(
        'https://images.rpgworldapp.com/avatars/user-123/avatar',
      );
    });

    it('should handle deeply nested paths', () => {
      expect(formatAssetUrl('rpg-assets/campaigns/2026/hero.webp')).toBe(
        'https://images.rpgworldapp.com/rpg-assets/campaigns/2026/hero.webp',
      );
    });

    it('should handle a simple filename with bucket', () => {
      expect(formatAssetUrl('avatars/avatar.png')).toBe(
        'https://images.rpgworldapp.com/avatars/avatar.png',
      );
    });
  });

  describe('development environment — default localhost', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      delete process.env.NEXT_PUBLIC_DEV_IMAGES_HOST;
    });

    it('should fallback to localhost:3000/api/images/ when env var is not set', () => {
      expect(formatAssetUrl('avatars/user-123/avatar')).toBe(
        'http://localhost:3000/api/images/avatars/user-123/avatar',
      );
    });

    it('should strip leading slash in dev', () => {
      expect(formatAssetUrl('/avatars/avatar.png')).toBe(
        'http://localhost:3000/api/images/avatars/avatar.png',
      );
    });
  });

  describe('development environment — custom host', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      process.env.NEXT_PUBLIC_DEV_IMAGES_HOST = 'localhost:3001';
    });

    it('should use the custom host with /api/images/ prefix', () => {
      expect(formatAssetUrl('avatars/user-123/avatar')).toBe(
        'http://localhost:3001/api/images/avatars/user-123/avatar',
      );
    });
  });
});
