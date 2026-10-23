import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import {
  CharacterSpellRelation,
  CharacterSpellRepo,
  SpellLookup,
} from '../../domain/repository/character-spell.repo';
import { findOwnedCharacter } from '../find-owned-character';

export type ToggleSpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export class ToggleCharacterSpellUseCase {
  constructor(
    private readonly characterRepository: CharacterRepo,
    private readonly spellRepository: CharacterSpellRepo,
    private readonly spells: SpellLookup,
  ) {}

  /**
   * Learning answers with the learned spell, in the requested language, so the client can add it
   * to the spellbook without fetching the whole list again. The other actions answer null.
   */
  async execute(
    characterId: string,
    requesterId: string,
    spellId: string,
    action: ToggleSpellAction,
    locale?: string,
  ): Promise<CharacterSpellRelation | null> {
    await findOwnedCharacter(this.characterRepository, characterId, requesterId, 'write');

    switch (action) {
      case 'learn': {
        // The database no longer checks the spell exists (it is a content key, not a foreign key)
        const [spell] = await this.spells.findByKeys([spellId], locale);
        if (!spell) {
          throw new CharacterError(CharacterErrorCodes.SPELL_NOT_FOUND);
        }
        await this.spellRepository.learn(characterId, spellId);
        return { ...spell, isPrepared: false };
      }
      case 'forget':
        await this.spellRepository.forget(characterId, spellId);
        break;
      case 'prepare':
        await this.spellRepository.togglePrepared(characterId, spellId, true);
        break;
      case 'unprepare':
        await this.spellRepository.togglePrepared(characterId, spellId, false);
        break;
      default:
        throw new CharacterError(CharacterErrorCodes.SPELL_ACTION_INVALID);
    }
    return null;
  }
}
