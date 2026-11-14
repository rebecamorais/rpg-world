import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import { GAME_ICON_NAMES } from '@frontend/constants/game-icon-names.generated';

import type { ItemCategory } from '@shared/systems/dnd5e/content/item.schema';

import {
  CATEGORY_ICONS,
  ITEM_GROUPS,
  ITEM_ICONS,
  UNKNOWN_ITEM_ICON,
  gameIconOf,
  groupOf,
} from './item-visuals';

const require = createRequire(import.meta.url);
const collection = JSON.parse(
  readFileSync(require.resolve('@iconify-json/game-icons/icons.json'), 'utf-8'),
) as { icons: Record<string, unknown>; aliases?: Record<string, unknown> };

function srdItemIds(): Set<string> {
  const ids = new Set<string>();
  for (const version of ['srd-5.1', 'srd-5.2']) {
    const items = JSON.parse(readFileSync(`content/dnd5e/${version}/items.json`, 'utf-8')) as {
      id: string;
    }[];
    for (const item of items) ids.add(item.id);
  }
  return ids;
}

describe('groupOf', () => {
  it.each<[ItemCategory, string]>([
    ['weapon', 'weapons'],
    ['ammunition', 'weapons'],
    ['armor', 'armor'],
    ['shield', 'armor'],
    ['focus', 'magic'],
    ['tool', 'tools'],
    ['kit', 'tools'],
    ['instrument', 'tools'],
    ['gear', 'gear'],
    ['food', 'gear'],
    ['trade-good', 'gear'],
    ['mount', 'other'],
    ['vehicle', 'other'],
    ['other', 'other'],
  ])('%s fica em %s', (category, group) => {
    expect(groupOf(category)).toBe(group);
  });

  it('item fora do catálogo vai para other', () => {
    expect(groupOf(null)).toBe('other');
  });

  it('ITEM_GROUPS tem a ordem da mochila', () => {
    expect(ITEM_GROUPS).toEqual(['weapons', 'armor', 'magic', 'tools', 'gear', 'other']);
  });
});

describe('gameIconOf', () => {
  it('usa o ícone do item quando mapeado', () => {
    expect(gameIconOf({ id: 'spellbook', category: 'gear' })).toBe(ITEM_ICONS.spellbook);
  });

  it('cai no ícone da categoria', () => {
    expect(gameIconOf({ id: 'not-mapped', category: 'tool' })).toBe(CATEGORY_ICONS.tool);
  });

  it('item fora do catálogo usa o ícone desconhecido', () => {
    expect(gameIconOf(null)).toBe(UNKNOWN_ITEM_ICON);
  });
});

describe('ícones', () => {
  const all = [...Object.values(CATEGORY_ICONS), ...Object.values(ITEM_ICONS), UNKNOWN_ITEM_ICON];

  it('existem na coleção Game Icons', () => {
    for (const name of all) {
      expect(Boolean(collection.icons[name] || collection.aliases?.[name]), name).toBe(true);
    }
  });

  it('estão no sprite gerado (npm run icons)', () => {
    for (const name of all) expect(GAME_ICON_NAMES.has(name), name).toBe(true);
  });

  it('cobrem os itens mais comuns', () => {
    const required =
      `spellbook spyglass ink-pen rope hempen-rope-50-feet silk-rope-50-feet torch rations rations-1-day backpack bedroll tent waterskin tinderbox component-pouch healer-s-kit thieves-tools shield dagger longsword shortsword greatsword battleaxe handaxe mace quarterstaff longbow shortbow light-crossbow hand-crossbow heavy-crossbow spear trident whip sling arrow arrows-20 plate-armor chain-mail leather-armor crystal orb wand staff holy-water lute`.split(
        ' ',
      );
    for (const id of required) expect(ITEM_ICONS[id], id).toBeTruthy();
  });

  it('todo id mapeado existe no SRD', () => {
    const ids = srdItemIds();
    for (const id of Object.keys(ITEM_ICONS)) expect(ids.has(id), id).toBe(true);
  });
});
