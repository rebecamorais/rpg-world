import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import sitemap from '../../../app/sitemap';

vi.mock('server-only', () => ({}));
// English `demo` messages, by dotted key ("nav.chest")
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) =>
    key
      .split('.')
      .reduce<unknown>((at, part) => (at as Record<string, unknown>)[part], messages.demo),
}));
vi.mock('@frontend/demo/data/build', () => ({
  buildDemoData: vi.fn(),
  resolveDemoSpells: vi.fn(),
}));

const params = Promise.resolve({ locale: 'en' });
const t = messages.demo;

describe('demo routes', () => {
  it('asks search engines to skip the demo', async () => {
    const { generateMetadata } = await import('../../../app/[locale]/(demo)/demo/layout');
    expect((await generateMetadata({ params })).robots).toEqual({ index: false, follow: false });
  });

  it('names the demo and each of its pages in the tab', async () => {
    const layout = await import('../../../app/[locale]/(demo)/demo/layout');
    const npcs = await import('../../../app/[locale]/(demo)/demo/npcs/page');
    const chest = await import('../../../app/[locale]/(demo)/demo/inventory/page');

    expect((await layout.generateMetadata({ params })).title).toEqual({
      default: t.metaTitle,
      template: `%s · ${t.metaTitle} · RPG World`,
    });
    expect((await npcs.generateMetadata({ params })).title).toBe(t.npcsTitle);
    expect((await chest.generateMetadata({ params })).title).toBe(t.nav.chest);
  });

  it('keeps /demo out of the sitemap', () => {
    expect(sitemap().some((entry) => entry.url.includes('/demo'))).toBe(false);
  });
});
