import { describe, expect, it } from 'vitest';

import { neighbours } from './useFocusAfterRemove';

describe('neighbours', () => {
  it('o seguinte, depois o anterior, depois os de reserva', () => {
    expect(neighbours(['a', 'b', 'c'], 'b', 'x')).toEqual(['c', 'a', 'x']);
  });

  it('no fim da lista, o anterior; sozinho, só as reservas que existem', () => {
    expect(neighbours(['a', 'b'], 'b', undefined, 'x')).toEqual(['a', 'x']);
    expect(neighbours(['a'], 'a', undefined)).toEqual([]);
  });

  it('um id fora da lista não vira o primeiro da lista', () => {
    expect(neighbours(['a', 'b'], 'z', 'x')).toEqual(['x']);
  });
});
