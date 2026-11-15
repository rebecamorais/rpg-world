import { describe, expect, it } from 'vitest';

import { neighborOf } from './CharactersContext';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('neighborOf', () => {
  it('o seguinte, ou o anterior no fim da lista', () => {
    expect(neighborOf(list, 'a')).toBe('b');
    expect(neighborOf(list, 'b')).toBe('c');
    expect(neighborOf(list, 'c')).toBe('b');
  });

  it('nenhum quando era o único, ou quando não está na lista', () => {
    expect(neighborOf([{ id: 'a' }], 'a')).toBeNull();
    expect(neighborOf(list, 'x')).toBeNull();
  });
});
