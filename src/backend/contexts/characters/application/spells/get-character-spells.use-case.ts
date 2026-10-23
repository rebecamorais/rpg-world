import { CharacterRepo } from '../../domain/repository';
import {
  CharacterSpellRelation,
  CharacterSpellRepo,
  SpellLookup,
} from '../../domain/repository/character-spell.repo';
import { assertOwnsCharacter } from '../find-owned-character';

export class GetCharacterSpellsUseCase {
  constructor(
    private readonly characterRepository: CharacterRepo,
    private readonly spellRepository: CharacterSpellRepo,
    private readonly spells: SpellLookup,
  ) {}

  /** The character's spells; one no longer in the catalog is left out. */
  async execute(
    characterId: string,
    requesterId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]> {
    await assertOwnsCharacter(this.characterRepository, characterId, requesterId, 'read');
    const links = await this.spellRepository.findByCharacterId(characterId);
    const spells = await this.spells.findByKeys(
      links.map((link) => link.ref),
      locale,
    );
    const byKey = new Map(links.map((link) => [link.ref, link]));

    return spells.map((spell) => ({
      ...spell,
      isPrepared: byKey.get(spell.id)!.isPrepared,
      createdAt: byKey.get(spell.id)!.createdAt,
    }));
  }
}
