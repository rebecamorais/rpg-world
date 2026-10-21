import { GetAllSpellsUseCase } from './application/get-all-spells.use-case';
import { FindSpellsParams } from './domain/repository/spells.repo';
import { SpellsRepo } from './domain/repository/spells.repo';
import { getSpellCatalog } from './infrastructure/srd-spells';

export { getSpellCatalog };

export class SpellsContext {
  private getAllSpellsUseCase: GetAllSpellsUseCase;

  constructor(repository: SpellsRepo) {
    this.getAllSpellsUseCase = new GetAllSpellsUseCase(repository);
  }

  async getAllSpells(params?: FindSpellsParams) {
    return this.getAllSpellsUseCase.execute(params);
  }
}

export function createSpellsContext() {
  return new SpellsContext(getSpellCatalog());
}
