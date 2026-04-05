import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import { GetAllSpellsUseCase } from './application/get-all-spells.use-case';
import { FindSpellsParams } from './domain/repository/spells.repo';
import { SpellsRepo } from './domain/repository/spells.repo';
import { SupabaseSpellsRepository } from './infrastructure/repositories/supabase-spells.repository';

export class SpellsContext {
  private getAllSpellsUseCase: GetAllSpellsUseCase;

  constructor(repository: SpellsRepo) {
    this.getAllSpellsUseCase = new GetAllSpellsUseCase(repository);
  }

  async getAllSpells(params?: FindSpellsParams) {
    return this.getAllSpellsUseCase.execute(params);
  }
}

export function createSpellsContext(dbClient: SupabaseClient<Database>) {
  const repository = new SupabaseSpellsRepository(dbClient);
  return new SpellsContext(repository);
}
