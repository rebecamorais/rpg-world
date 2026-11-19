import { describe, expect, it } from 'vitest';

import robots from './robots';
import sitemap from './sitemap';

const WWW = 'https://www.rpgworldapp.com';

describe('sitemap', () => {
  it('aponta para o domínio com www, que é o que a Vercel serve sem redirecionar', () => {
    expect(sitemap().every((entry) => entry.url.startsWith(WWW))).toBe(true);
    expect(robots().sitemap).toBe(`${WWW}/sitemap.xml`);
  });

  it('cada página pública aparece em inglês e em português, ligadas pelo hreflang', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining([WWW, `${WWW}/pt`, `${WWW}/pt/features`]));
    expect(sitemap().find((entry) => entry.url === `${WWW}/pt/features`)?.alternates).toEqual({
      languages: {
        en: `${WWW}/features`,
        'pt-BR': `${WWW}/pt/features`,
        'x-default': `${WWW}/features`,
      },
    });
  });
});
