import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import {
  CharacterSpellRelation,
  CharacterSpellRepo,
  SpellLookup,
} from '../../domain/repository/character-spell.repo';
import { listCharacterSpells } from '../spells/get-character-spells.use-case';

/** The spellbook of a character brought to the GM's party, read only. */
export class GetPartyCharacterSpellsUseCase {
  constructor(
    private readonly spellRepository: CharacterSpellRepo,
    private readonly spells: SpellLookup,
    private readonly access: PartyGmAccess,
  ) {}

  async execute(
    partyId: string,
    id: string,
    gmId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]> {
    if (!(await this.access.isGmOfCharacter(partyId, id, gmId))) {
      throw new CharacterError(CharacterErrorCodes.ACCESS_NOT_FOUND);
    }
    return listCharacterSpells(this.spellRepository, this.spells, id, locale);
  }
}
