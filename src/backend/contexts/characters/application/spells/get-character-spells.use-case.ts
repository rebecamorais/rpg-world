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

  /** The owner's view of the spellbook. */
  async execute(
    characterId: string,
    requesterId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]> {
    await assertOwnsCharacter(this.characterRepository, characterId, requesterId, 'read');
    return listCharacterSpells(this.spellRepository, this.spells, characterId, locale);
  }
}

/** The character's spells from the catalog; one no longer in the catalog is left out. */
export async function listCharacterSpells(
  spellRepository: CharacterSpellRepo,
  spells: SpellLookup,
  characterId: string,
  locale?: string,
): Promise<CharacterSpellRelation[]> {
  const links = await spellRepository.findByCharacterId(characterId);
  const found = await spells.findByKeys(
    links.map((link) => link.ref),
    locale,
  );
  const byKey = new Map(links.map((link) => [link.ref, link]));

  return found.map((spell) => ({
    ...spell,
    isPrepared: byKey.get(spell.id)!.isPrepared,
    createdAt: byKey.get(spell.id)!.createdAt,
  }));
}
