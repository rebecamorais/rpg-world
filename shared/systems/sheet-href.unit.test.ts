import { describe, expect, it } from 'vitest';

import { type SheetTab, sheetHref } from './sheet-href';

describe('sheetHref', () => {
  it.each([
    ['dnd5e', 'c1', undefined, '/system/dnd5e/character/c1'],
    ['DnD_5e', 'c1', undefined, '/system/dnd5e/character/c1'],
    ['dnd_5e', 'c1', 'spells', '/system/dnd5e/character/c1/spells'],
    ['unknown', 'c1', 'lore', '/system/dnd5e/character/c1/lore'],
  ])('sheetHref(%s, %s, %s) is %s', (system, id, tab, href) => {
    expect(sheetHref(system, id, tab as SheetTab | undefined)).toBe(href);
  });
});
