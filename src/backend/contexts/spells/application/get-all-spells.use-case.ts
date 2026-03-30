import { SpellDto, SpellsRepo } from '../domain/repository/spells.repo';

export class GetAllSpellsUseCase {
  constructor(private readonly repository: SpellsRepo) {}

  async execute(locale?: string): Promise<SpellDto[]> {
    return this.repository.findAll(locale);
  }
}
