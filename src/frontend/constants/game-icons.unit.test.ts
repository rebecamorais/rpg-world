import { describe, expect, it } from 'vitest';

import { buildGameIcons } from '../../../scripts/game-icons';
import bundled from './game-icons.generated.json';

describe('game-icons.generated.json', () => {
  it('tem exatamente os game icons usados no código (rode `npm run icons` se falhar)', () => {
    expect(Object.keys(bundled)).toEqual(Object.keys(buildGameIcons()));
  });
});
