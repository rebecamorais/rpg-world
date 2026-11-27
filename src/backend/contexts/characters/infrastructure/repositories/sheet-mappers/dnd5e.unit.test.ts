import { describe, expect, it } from 'vitest';

import { Lore } from '@backend/contexts/lore/domain/Lore';

import { readHitDice } from '@shared/systems/dnd5e/hit-dice';

import { Attributes } from '../../../domain/value-object/Attributes';
import { HealthPoints } from '../../../domain/value-object/HealthPoints';
import { dnd5eSheetMapper } from './dnd5e';
import { sheetMapperFor } from './index';
import type { CommonCharacterFields, DbCharacterRow } from './types';

function row(overrides: Partial<DbCharacterRow> = {}): DbCharacterRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Legacy',
    owner_id: 'owner',
    system: 'dnd_5e',
    level: 1,
    hp_current: 8,
    hp_max: 8,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    avatar_url: null,
    sheet_background_url: null,
    theme_color: '#6d28d9',
    kind: 'pc',
    system_data: {},
    revision: 3,
    row_version: 4,
    ...overrides,
  } as unknown as DbCharacterRow;
}

function common(): CommonCharacterFields {
  return {
    attributes: new Attributes({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
    hp: new HealthPoints(8, 8),
    lore: Lore.empty(),
  };
}

describe('dnd5eSheetMapper', () => {
  it('keeps the old 30 ft speed for a sheet saved without one', () => {
    expect(dnd5eSheetMapper.fromRow(row({ system_data: {} }), common()).toJSON().speed).toBe(30);
  });

  it('reads legacy hit dice {total,current} as what was spent', () => {
    const sheet = dnd5eSheetMapper.fromRow(
      row({ level: 5, system_data: { hitDice: { total: '5d10', current: 2 } } }),
      common(),
    );
    expect(sheet.toJSON().hitDice).toEqual(readHitDice({ total: '5d10', current: 2 }, 5));
  });

  it('keeps the other legacy defaults', () => {
    const json = dnd5eSheetMapper.fromRow(row(), common()).toJSON();
    expect(json as Record<string, unknown>).toMatchObject({
      ac: 10,
      initiative: 0,
      passivePerception: 10,
      hpTemp: 0,
    });
    expect(json.system).toBe('dnd5e');
  });
});

describe('sheetMapperFor', () => {
  it('resolves the stored dnd_5e value', () => {
    expect(sheetMapperFor('dnd_5e')).toBe(dnd5eSheetMapper);
  });

  it('fails the same way as before for a system with no mapper', () => {
    expect(() => sheetMapperFor('pathfinder_2e')).toThrow(
      'System pathfinder_2e not implemented in repository mapping',
    );
  });
});
