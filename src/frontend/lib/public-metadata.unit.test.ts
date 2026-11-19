import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { languageAlternates, publicPageMetadata } from './public-metadata';

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({
      locale,
      messages: locale === 'pt' ? pt : en,
      namespace: namespace as 'seo',
    }),
}));

describe('languageAlternates', () => {
  it('liga o endereço de cada idioma, com o x-default no caminho sem prefixo', () => {
    expect(languageAlternates('/features')).toEqual({
      en: '/features',
      'pt-BR': '/pt/features',
      'x-default': '/features',
    });
    expect(languageAlternates('/')).toEqual({ en: '/', 'pt-BR': '/pt', 'x-default': '/' });
  });
});

describe('publicPageMetadata', () => {
  it('em português, o canonical e o og:url são o endereço /pt da página', async () => {
    const metadata = await publicPageMetadata({
      locale: 'pt',
      path: '/privacy',
      title: 'Política de Privacidade',
      description: 'Uma frase.',
    });

    expect(metadata.alternates?.canonical).toBe('/pt/privacy');
    expect(metadata.openGraph).toMatchObject({ url: '/pt/privacy', locale: 'pt_BR' });
  });

  it('o openGraph sai inteiro, com a marca no título e o alt da imagem', async () => {
    const metadata = await publicPageMetadata({
      locale: 'en',
      path: '/features',
      title: 'Features',
      description: 'What it does.',
    });

    expect(metadata.title).toBe('Features');
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'RPG World',
      locale: 'en_US',
      url: '/features',
      title: 'Features · RPG World',
      description: 'What it does.',
      images: [{ url: '/og-image.jpg', alt: en.seo.ogImageAlt }],
    });
    expect(metadata.twitter).toMatchObject({
      title: 'Features · RPG World',
      description: 'What it does.',
    });
  });

  it('sem título nem descrição (a home), usa os do site no idioma da página', async () => {
    const metadata = await publicPageMetadata({ locale: 'pt', path: '/' });

    expect(metadata.title).toBeUndefined();
    expect(metadata.description).toBe(pt.seo.description);
    expect(metadata.openGraph?.title).toBe(pt.seo.title);
    expect(metadata.alternates?.canonical).toBe('/pt');
  });
});
