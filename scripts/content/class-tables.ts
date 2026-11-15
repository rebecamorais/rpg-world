import type { ClassBook, TableSpec } from './5etools-classes';

/*
 * Numbers of the class table that are not spent, so they are not resources: the sheet only shows
 * them. Each is read from its column of the table. Only SRD 5.1: the sheet follows the class on
 * the 2014 edition alone (#181).
 */
export const CLASS_TABLES: Record<ClassBook, Record<string, TableSpec[]>> = {
  'srd-5.1': {
    barbarian: [{ id: 'rage-damage', feature: 'rage', kind: 'bonus', column: 'Rage Damage' }],
    monk: [
      { id: 'martial-arts', feature: 'martial-arts', kind: 'die', column: 'Martial Arts' },
      {
        id: 'unarmored-movement',
        feature: 'unarmored-movement',
        kind: 'speed',
        column: 'Unarmored Movement',
      },
    ],
    rogue: [{ id: 'sneak-attack', feature: 'sneak-attack', kind: 'dice', column: 'Sneak Attack' }],
  },
  'srd-5.2': {},
};
