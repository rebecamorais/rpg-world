import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { CharacterSpellRepo, SpellLookup } from '../../domain/repository/character-spell.repo';
import { findOwnedCharacter } from '../find-owned-character';

export type ToggleSpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export class ToggleCharacterSpellUseCase {
  constructor(
    private readonly characterRepository: CharacterRepo,
    private readonly spellRepository: CharacterSpellRepo,
    private readonly spells: SpellLookup,
  ) {}

  async execute(
    characterId: string,
    requesterId: string,
    spellId: string,
    action: ToggleSpellAction,
  ): Promise<void> {
    await findOwnedCharacter(this.characterRepository, characterId, requesterId, 'write');

    switch (action) {
      case 'learn':
        // The database no longer checks the spell exists (it is a content key, not a foreign key)
        if ((await this.spells.findByKeys([spellId])).length === 0) {
          throw new CharacterError(CharacterErrorCodes.SPELL_NOT_FOUND);
        }
        await this.spellRepository.learn(characterId, spellId);
        break;
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
  }
}
