import { CharacterOwnership } from '../../domain/CharacterOwnership';
import { Lore } from '../../domain/Lore';
import { LoreRepository } from '../../domain/repository/lore.repo';
import { assertCharacterOwner } from '../assert-character-owner';

export class UpdateLoreUseCase {
  constructor(
    private readonly repository: LoreRepository,
    private readonly ownership: CharacterOwnership,
  ) {}

  async execute(characterId: string, requesterId: string, lore: Lore) {
    await assertCharacterOwner(this.ownership, characterId, requesterId);
    return this.repository.save(characterId, lore);
  }
}
