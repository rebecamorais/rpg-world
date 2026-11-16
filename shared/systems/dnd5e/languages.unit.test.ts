import { describe, expect, it } from 'vitest';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { LANGUAGE_IDS, isLanguageId } from './languages';

describe('catálogo de idiomas do SRD 5.1', () => {
  it('tem os 16 idiomas e os dois secretos, sem repetir', () => {
    expect(LANGUAGE_IDS).toHaveLength(18);
    expect(new Set(LANGUAGE_IDS).size).toBe(18);
    expect(LANGUAGE_IDS).toEqual(expect.arrayContaining(['druidic', 'thieves-cant']));
  });

  it.each([
    ['en', en],
    ['pt', pt],
  ])('todo id tem nome em %s, e só eles', (_, messages) => {
    expect(Object.keys(messages.proficiencies.languages).sort()).toEqual([...LANGUAGE_IDS].sort());
  });

  it('nome não é id', () => {
    expect(isLanguageId('elvish')).toBe(true);
    expect(isLanguageId('Élfico')).toBe(false);
    expect(isLanguageId('Elvish')).toBe(false);
  });
});
