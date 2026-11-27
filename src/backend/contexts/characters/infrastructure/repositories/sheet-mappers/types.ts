import type { Lore } from '@backend/contexts/lore/domain/Lore';

import type { Database } from '@database-types';

import type { Character } from '../../../domain/entity/Character';
import type { Attributes } from '../../../domain/value-object/Attributes';
import type { HealthPoints } from '../../../domain/value-object/HealthPoints';

export type DbCharacterRow = Database['public']['Tables']['characters']['Row'];

/** Fields every system shares; the mapper builds the rest from `system_data`. */
export interface CommonCharacterFields {
  attributes: Attributes;
  hp: HealthPoints;
  lore: Lore;
}

export interface SheetMapper {
  fromRow(row: DbCharacterRow, common: CommonCharacterFields): Character;
}
