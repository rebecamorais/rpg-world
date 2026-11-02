import { describe, expect, it } from 'vitest';

import {
  conditionKey,
  contentIdFromName,
  itemKey,
  parseContentKey,
  parseSpellKey,
  spellKey,
} from './content-key';

describe('chave de conteúdo', () => {
  it('monta e lê a chave de uma magia', () => {
    expect(spellKey('srd-5.1', 'fireball')).toBe('dnd5e:srd-5.1:spell:fireball');
    expect(parseSpellKey('dnd5e:srd-5.2:spell:fireball')).toEqual({
      source: 'srd-5.2',
      id: 'fireball',
    });
  });

  it('chave de condição e leitura genérica', () => {
    expect(conditionKey('srd-5.2', 'prone')).toBe('dnd5e:srd-5.2:condition:prone');
    expect(parseContentKey('dnd5e:srd-5.1:spell:fireball')).toEqual({
      source: 'srd-5.1',
      type: 'spell',
      id: 'fireball',
    });
    expect(parseContentKey('lixo')).toBeNull();
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

describe('id a partir do nome', () => {
  it.each([
    ['Arrows (20)', 'arrows-20'],
    ["Scholar's Pack", 'scholar-s-pack'],
    ['  Plate Armor ', 'plate-armor'],
  ])('%s vira %s', (name, id) => {
    expect(contentIdFromName(name)).toBe(id);
  });

  it('monta a chave de um item', () => {
    expect(itemKey('srd-5.2', 'rope')).toBe('dnd5e:srd-5.2:item:rope');
  });
});
