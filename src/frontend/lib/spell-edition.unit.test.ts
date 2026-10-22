import { describe, expect, it } from 'vitest';

import { inferEdition } from './spell-edition';

const k2014 = (id: string) => `dnd5e:srd-5.1:spell:${id}`;
const k2024 = (id: string) => `dnd5e:srd-5.2:spell:${id}`;

describe('inferEdition', () => {
  it('a edição da maioria das magias do grimório', () => {
    expect(inferEdition([k2014('a'), k2014('b'), k2014('c'), k2024('d')])).toBe('2014');
    expect(inferEdition([k2014('a'), k2024('b'), k2024('c')])).toBe('2024');
  });

  it('grimório vazio ou empate começa em 2024', () => {
    expect(inferEdition([])).toBe('2024');
    expect(inferEdition([k2014('a'), k2024('b')])).toBe('2024');
  });

  it('ignora chaves de fontes desconhecidas', () => {
    expect(inferEdition(['dnd5e:homebrew:spell:x', 'dnd5e:homebrew:spell:y', k2014('a')])).toBe(
      '2014',
    );
  });
});
