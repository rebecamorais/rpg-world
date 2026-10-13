import { CharacterOwnership } from '../../domain/CharacterOwnership';
import { LoreRepository } from '../../domain/repository/lore.repo';
import { assertCharacterOwner } from '../assert-character-owner';

export class GetLoreUseCase {
  constructor(
    private readonly repository: LoreRepository,
    private readonly ownership: CharacterOwnership,
  ) {}

  async execute(characterId: string, requesterId: string) {
    await assertCharacterOwner(this.ownership, characterId, requesterId);
    return this.repository.findByCharacterId(characterId);
  }
}
