import { describe, expect, it } from 'vitest';

import { componentOf, languageOf, tokenFrom } from './weblate-translations';

describe('componentOf', () => {
  it('names the rules component of a book and file', () =>
    expect(componentOf('srd-5.2', 'classes')).toBe('srd-5-2-classes'));
});

describe('languageOf', () => {
  it('uses the Weblate code of each locale (pt is Brazilian Portuguese)', () => {
    expect(languageOf('pt')).toBe('pt_BR');
    expect(languageOf('es')).toBe('es');
  });
});

describe('tokenFrom', () => {
  const config = '[keys]\nhttps://hosted.weblate.org/api/ = wlu_abc123\n';

  it('prefers WEBLATE_TOKEN', () => expect(tokenFrom('wlu_env', config)).toBe('wlu_env'));

  it("reads wlc's config file otherwise", () =>
    expect(tokenFrom(undefined, config)).toBe('wlu_abc123'));

  it('is undefined without either', () => expect(tokenFrom(undefined, undefined)).toBeUndefined());
});
