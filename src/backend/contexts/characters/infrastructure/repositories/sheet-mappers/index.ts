import { type SystemId, fromDbSystem } from '@shared/systems/registry';

import { dnd5eSheetMapper } from './dnd5e';
import type { SheetMapper } from './types';

export type { CommonCharacterFields, DbCharacterRow, SheetMapper } from './types';

const SHEET_MAPPERS: Record<SystemId, SheetMapper> = {
  dnd5e: dnd5eSheetMapper,
};

/** Resolves the mapper for a `characters.system` value as stored in the database. */
export function sheetMapperFor(dbSystem: string): SheetMapper {
  const id = fromDbSystem(dbSystem);
  if (!id) throw new Error(`System ${dbSystem} not implemented in repository mapping`);
  return SHEET_MAPPERS[id];
}
