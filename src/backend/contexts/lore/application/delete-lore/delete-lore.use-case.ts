import { LoreRepository } from '../../domain/repository/lore.repo';

export class DeleteLoreUseCase {
  constructor(private readonly repository: LoreRepository) {}

  async execute(id: string) {
    return this.repository.delete(id);
  }
}
