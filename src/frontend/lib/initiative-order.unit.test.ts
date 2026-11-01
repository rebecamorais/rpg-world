import { describe, expect, it } from 'vitest';

import { sortByInitiative } from './initiative-order';

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
