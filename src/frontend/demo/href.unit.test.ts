import { describe, expect, it } from 'vitest';

import { toDemoHref } from './href';

describe('toDemoHref', () => {
  it.each([
    ['/parties/the-pioneers', '/demo'],
    ['/parties/the-pioneers/inventory', '/demo/inventory'],
    ['/parties/the-pioneers/characters/ada/lore', '/demo/characters/ada/lore'],
    ['/system/dnd5e/character/joan/spells', '/demo/characters/joan/spells'],
    ['/characters/npcs', '/demo/npcs'],
    ['/characters/new?kind=npc', '/register'],
    ['/settings/profile', '/register'],
    ['/parties/the-pioneers/settings', '/register'],
    ['/parties', '/demo'],
    ['/demo/inventory', '/demo/inventory'],
    ['#spells', '#spells'],
  ])('%s vira %s', (from, to) => expect(toDemoHref(from)).toBe(to));
});
