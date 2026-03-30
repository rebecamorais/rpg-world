import {
  CharacterSpellRelation,
  CharacterSpellRepo,
} from '../../domain/repository/character-spell.repo';

export class GetCharacterSpellsUseCase {
  constructor(private readonly repository: CharacterSpellRepo) {}

  async execute(characterId: string, locale?: string): Promise<CharacterSpellRelation[]> {
    return this.repository.findByCharacterId(characterId, locale);
  }
}
