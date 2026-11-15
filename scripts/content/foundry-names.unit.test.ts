import { describe, expect, it } from 'vitest';

import { cleanName, esNameIndex, ptNameIndex } from './foundry-names';

describe('ptNameIndex', () => {
  const index = ptNameIndex([
    {
      Rage: { name: 'Fúria' },
      'Ability Score Improvement': { name: 'Aumento no Valor de Atributo' },
    },
    {
      'Ability Score Improvement (Fighter)': { name: 'Aumento no Valor de Atributo (Guerreiro)' },
    },
  ]);

  it('finds by English name', () => expect(index.get('Rage', ['Barbarian'])).toBe('Fúria'));

  it('prefers the class variant, without its suffix', () =>
    expect(index.get('Ability Score Improvement', ['Fighter'])).toBe(
      'Aumento no Valor de Atributo',
    ));

  it('keeps parentheses that are part of the English name too', () => {
    const own = ptNameIndex([
      { 'Brutal Critical (1 die) (Barbarian)': { name: 'Crítico Brutal (1 dado) (Bárbaro)' } },
    ]);
    expect(own.get('Brutal Critical (1 die)', ['Barbarian'])).toBe('Crítico Brutal (1 dado)');
    const bare = ptNameIndex([
      { 'Brutal Critical (1 die) (Barbarian)': { name: 'Crítico Brutal (1 dado)' } },
    ]);
    expect(bare.get('Brutal Critical (1 die)', ['Barbarian'])).toBe('Crítico Brutal (1 dado)');
  });

  it('falls back to the plain name', () =>
    expect(index.get('Ability Score Improvement', ['Wizard'])).toBe(
      'Aumento no Valor de Atributo',
    ));

  it('misses unknown names', () =>
    expect(index.get('Weapon Mastery', ['Fighter'])).toBeUndefined());
});

describe('esNameIndex', () => {
  const ids = new Map([
    ['a', 'Rage'],
    ['b', 'Spellcasting'],
    ['c', 'Spellcasting'],
    ['d', 'Rage'],
  ]);
  const index = esNameIndex(
    {
      a: { name: 'Furia' },
      b: { name: 'Lanzamiento de conjuros' },
      c: { name: 'Conjuros' },
      d: { name: 'Furia' },
      z: { name: 'X' },
    },
    ids,
  );

  it('maps Foundry ids to English names', () => expect(index.get('Rage', [])).toBe('Furia'));

  it('skips names with two different translations', () => {
    expect(index.get('Spellcasting', [])).toBeUndefined();
    expect(index.ambiguous).toContain('Spellcasting');
    expect(index.ambiguous).not.toContain('Rage');
  });
});

describe('cleanName', () => {
  it('trims and decodes', () =>
    expect(cleanName('  Armas &amp; Armaduras ', 'Arms')).toBe('Armas & Armaduras'));

  it('drops empty and untranslated', () => {
    expect(cleanName('  ', 'Rage')).toBeUndefined();
    expect(cleanName(undefined, 'Rage')).toBeUndefined();
    expect(cleanName('Halfling', 'Halfling')).toBeUndefined();
  });
});
