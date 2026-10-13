import { CharacterRepo } from '../../domain/repository';
import {
  CharacterSpellRelation,
  CharacterSpellRepo,
} from '../../domain/repository/character-spell.repo';
import { findOwnedCharacter } from '../find-owned-character';

export class GetCharacterSpellsUseCase {
  constructor(
    private readonly characterRepository: CharacterRepo,
    private readonly spellRepository: CharacterSpellRepo,
  ) {}

  async execute(
    characterId: string,
    requesterId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]> {
    await findOwnedCharacter(this.characterRepository, characterId, requesterId, 'read');
    return this.spellRepository.findByCharacterId(characterId, locale);
  }
}
