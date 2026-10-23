import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  buildGameIconSprite,
  buildGameIcons,
  gameIconSpriteName,
} from '../../../scripts/game-icons';
import { GAME_ICON_NAMES, GAME_ICON_SPRITE } from './game-icon-sprite.generated';

describe('sprite dos game icons', () => {
  it('tem exatamente os game icons usados no código (rode `npm run icons` se falhar)', () => {
    const icons = buildGameIcons();
    const sprite = buildGameIconSprite(icons);

    expect([...GAME_ICON_NAMES]).toEqual(Object.keys(icons));
    expect(GAME_ICON_SPRITE).toBe(`/icons/${gameIconSpriteName(sprite)}`);
    expect(readFileSync(`public${GAME_ICON_SPRITE}`, 'utf-8')).toBe(sprite);
  });
});
