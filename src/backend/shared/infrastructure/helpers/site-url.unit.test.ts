import { afterEach, describe, expect, it, vi } from 'vitest';

import { siteUrl } from './site-url';

describe('siteUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses NEXT_PUBLIC_SITE_URL in production, ignoring trailing slashes', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_BRANCH_URL', 'rpg-world-git-main-team.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rpgworldapp.com/');

    expect(siteUrl()).toBe('https://rpgworldapp.com');
  });

  it('points a preview deployment back to its own branch URL', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_BRANCH_URL', 'rpg-world-git-feat-x-team.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rpgworldapp.com');

    expect(siteUrl()).toBe('https://rpg-world-git-feat-x-team.vercel.app');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when a preview has no branch URL', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_BRANCH_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');

    expect(siteUrl()).toBe('http://localhost:3000');
  });
});
