import { renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import pt from '../../../messages/pt.json';
import Home, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async (options: string | { namespace: string }) =>
    createTranslator({
      locale: 'pt',
      messages: pt,
      namespace: (typeof options === 'string' ? options : options.namespace) as never,
    }),
}));
// Async server components and the parts with their own tests: only the page's own output here
vi.mock('@frontend/components/landing/FeatureGrid', () => ({
  AVAILABLE_FEATURES: [],
  FeatureGrid: () => null,
}));
vi.mock('@frontend/components/layout/HeroCTA', () => ({ default: () => null }));
vi.mock('@frontend/components/layout/SheetPreview', () => ({ SheetPreview: () => null }));
vi.mock('@frontend/components/landing/AccountDeletedNotice', () => ({
  AccountDeletedNotice: () => null,
}));

const params = Promise.resolve({ locale: 'pt' });

describe('página inicial', () => {
  it('os dados estruturados descrevem o app no idioma da página, com o endereço dela', async () => {
    const { container } = renderWithProviders(await Home({ params }));

    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.innerHTML);
    expect(data.description).toBe(pt.seo.description);
    expect(data.url).toBe('https://www.rpgworldapp.com/pt');
  });

  it('"Ver todas" leva às funcionalidades em português', async () => {
    const { getByRole } = renderWithProviders(await Home({ params }));

    expect(getByRole('link', { name: pt.features.seeAll })).toHaveAttribute('href', '/pt/features');
  });

  it('tem canonical e hreflang', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata.alternates).toEqual({
      canonical: '/pt',
      languages: { en: '/', 'pt-BR': '/pt', 'x-default': '/' },
    });
  });
});
