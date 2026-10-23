import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  GAME_ICON_SPRITE_FILE,
  buildGameIconSprite,
  buildGameIcons,
} from '../../../scripts/game-icons';
import { GAME_ICON_NAMES } from './game-icon-names.generated';

describe('sprite dos game icons', () => {
  it('tem exatamente os game icons usados no código (rode `npm run icons` se falhar)', () => {
    const icons = buildGameIcons();

    expect([...GAME_ICON_NAMES]).toEqual(Object.keys(icons));
    expect(readFileSync(GAME_ICON_SPRITE_FILE, 'utf-8')).toBe(buildGameIconSprite(icons));
  });
});
