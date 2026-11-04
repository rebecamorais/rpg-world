import { describe, expect, it, vi } from 'vitest';

import sitemap from '../../../app/sitemap';

vi.mock('server-only', () => ({}));
vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }));
vi.mock('@frontend/demo/data/build', () => ({
  buildDemoData: vi.fn(),
  resolveDemoSpells: vi.fn(),
}));

describe('demo routes', () => {
  it('asks search engines to skip the demo', async () => {
    const { metadata } = await import('../../../app/[locale]/(demo)/demo/layout');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('keeps /demo out of the sitemap', () => {
    expect(sitemap().some((entry) => entry.url.includes('/demo'))).toBe(false);
  });
});
