import { describe, expect, it } from 'vitest';

import { parseSpellKey, spellKey } from './content-key';

describe('chave de conteúdo', () => {
  it('monta e lê a chave de uma magia', () => {
    expect(spellKey('srd-5.1', 'fireball')).toBe('dnd5e:srd-5.1:spell:fireball');
    expect(parseSpellKey('dnd5e:srd-5.2:spell:fireball')).toEqual({
      source: 'srd-5.2',
      id: 'fireball',
    });
  });

  it.each([
    'fireball',
    'dnd5e:srd-5.1:item:rope',
    'dnd5e:srd 5.1:spell:x',
    'e2e00000-0000-4000-8000-000000000001',
  ])('recusa %s', (key) => {
    expect(parseSpellKey(key)).toBeNull();
  });
});
