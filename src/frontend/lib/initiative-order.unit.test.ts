import { describe, expect, it } from 'vitest';

import { isSortedByInitiative, sortByInitiative, tiedNeighbors } from './initiative-order';

describe('sortByInitiative', () => {
  it('do maior para o menor; quem empata mantém a ordem atual', () => {
    expect(
      sortByInitiative([
        { participantId: 'a', initiative: 10 },
        { participantId: 'b', initiative: 18 },
        { participantId: 'c', initiative: 10 },
        { participantId: 'd', initiative: 12 },
      ]),
    ).toEqual(['b', 'd', 'a', 'c']);
  });

  it('quem ainda não tem iniciativa vai para o fim, na ordem atual', () => {
    expect(
      sortByInitiative([
        { participantId: 'a', initiative: null },
        { participantId: 'b', initiative: -2 },
        { participantId: 'c', initiative: null },
      ]),
    ).toEqual(['b', 'a', 'c']);
  });
});

describe('isSortedByInitiative', () => {
  it('verdadeiro quando a ordem atual é a que a ordenação daria', () => {
    expect(
      isSortedByInitiative([
        { participantId: 'b', initiative: 18 },
        { participantId: 'a', initiative: 10 },
        { participantId: 'c', initiative: 10 },
        { participantId: 'd', initiative: null },
      ]),
    ).toBe(true);
  });

  it('falso quando alguém mudou a iniciativa e saiu da ordem', () => {
    expect(
      isSortedByInitiative([
        { participantId: 'a', initiative: 10 },
        { participantId: 'b', initiative: 18 },
      ]),
    ).toBe(false);
    expect(
      isSortedByInitiative([
        { participantId: 'a', initiative: null },
        { participantId: 'b', initiative: 3 },
      ]),
    ).toBe(false);
  });
});

describe('tiedNeighbors', () => {
  const rows = [
    { participantId: 'a', initiative: 15 },
    { participantId: 'b', initiative: 12 },
    { participantId: 'c', initiative: 12 },
    { participantId: 'd', initiative: 12 },
    { participantId: 'e', initiative: null },
    { participantId: 'f', initiative: null },
  ];

  it('devolve os vizinhos de cima e de baixo com a mesma iniciativa', () => {
    expect(tiedNeighbors(rows, 2)).toEqual({ above: rows[1], below: rows[3] });
    expect(tiedNeighbors(rows, 1)).toEqual({ above: undefined, below: rows[2] });
    expect(tiedNeighbors(rows, 0)).toEqual({ above: undefined, below: undefined });
  });

  it('sem iniciativa ninguém empata', () => {
    expect(tiedNeighbors(rows, 4)).toEqual({ above: undefined, below: undefined });
  });
});
