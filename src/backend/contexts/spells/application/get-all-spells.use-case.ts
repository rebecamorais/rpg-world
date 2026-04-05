import { FindSpellsParams, PaginatedSpells, SpellsRepo } from '../domain/repository/spells.repo';

export class GetAllSpellsUseCase {
  constructor(private readonly repository: SpellsRepo) {}

  async execute(params?: FindSpellsParams): Promise<PaginatedSpells> {
    return this.repository.findAll(params);
  }
}
