import { describe, expect, it } from 'vitest';

import { conditionIdsOf, parseTags, stripTags, tagsOf } from './tags';

describe('stripTags', () => {
  it('mostra o texto de exibição ou o corpo', () => {
    expect(stripTags('{@chance 50} of the time, {@b bold} and {@spell fireball|XPHB}')).toBe(
      '50% of the time, bold and fireball',
    );
  });

  it.each([
    ['A {@filter Tiny|bestiary|size=T} beast', 'A Tiny beast'],
    ['either a {@filter Beast|bestiary|type=beast} or not', 'either a Beast or not'],
    ['the rules on {@book mounted combat|XPHB|1|Mounted Combat}.', 'the rules on mounted combat.'],
    ['make a {@dc 15} Intelligence saving throw', 'make a DC 15 Intelligence saving throw'],
  ])('marcação %s', (text, expected) => {
    expect(stripTags(text)).toBe(expected);
  });
});

describe('parseTags', () => {
  it('separa texto e tag com exibição', () => {
    expect(parseTags('O alvo fica {@condition frightened||amedrontado}.')).toEqual([
      { kind: 'text', text: 'O alvo fica ' },
      {
        kind: 'tag',
        tag: 'condition',
        target: 'frightened',
        display: 'amedrontado',
        text: 'amedrontado',
      },
      { kind: 'text', text: '.' },
    ]);
  });

  it('alvo em minúsculas, sem exibição mostra o corpo', () => {
    expect(parseTags('{@condition Frightened|XPHB}')[0]).toMatchObject({
      target: 'frightened',
      display: null,
      text: 'Frightened',
    });
  });

  it('o que está aninhado vira texto puro', () => {
    expect(parseTags('{@b {@dice 1d6}}')).toEqual([
      { kind: 'tag', tag: 'b', target: '1d6', display: null, text: '1d6' },
    ]);
  });

  it('tag sem fechar é texto', () => {
    const text = 'sem fechar {@condition frightened';
    expect(parseTags(text)).toEqual([{ kind: 'text', text }]);
  });

  it('texto vazio', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('tagsOf', () => {
  it('lista as tags de dentro para fora', () => {
    expect(tagsOf('{@b {@condition prone}} e {@damage 8d6}')).toEqual([
      { tag: 'condition', target: 'prone' },
      { tag: 'damage', target: '8d6' },
      { tag: 'b', target: 'prone' },
    ]);
  });
});

describe('conditionIdsOf', () => {
  it('ids sem repetir, em ordem alfabética', () => {
    expect(
      conditionIdsOf('{@condition prone}', undefined, '{@condition blinded} {@condition prone}'),
    ).toEqual(['blinded', 'prone']);
  });
});
