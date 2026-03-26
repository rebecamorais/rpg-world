import { LoreRepository } from '../../domain/repository/lore.repo';

export class GetLoreUseCase {
  constructor(private readonly repository: LoreRepository) {}

  async execute(characterId: string) {
    return this.repository.findByCharacterId(characterId);
  }
}
