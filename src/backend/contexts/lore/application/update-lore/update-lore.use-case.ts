import { Lore } from '../../domain/Lore';
import { LoreRepository } from '../../domain/repository/lore.repo';

export class UpdateLoreUseCase {
  constructor(private readonly repository: LoreRepository) {}

  async execute(id: string, lore: Lore) {
    return this.repository.save(id, lore);
  }
}
