import { describe, expect, it } from 'vitest';

import { newAssetVersion } from './asset-version';

describe('newAssetVersion', () => {
  it('is safe to use in a storage path', () => {
    expect(newAssetVersion()).toMatch(/^[a-z0-9]+$/);
  });

  it('is different on every call', () => {
    const versions = new Set(Array.from({ length: 50 }, () => newAssetVersion()));
    expect(versions.size).toBe(50);
  });
});
